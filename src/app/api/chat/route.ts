import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { MessageSender, MessageType } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const systemPrompt = `
You are Ved AI's problem generator, specialized in creating high-quality programming interview questions and helping software engineers prepare for technical interviews. 
Your role is to generate clear, well-structured programming problems that test important concepts.

For any question that is not related to interview preparation, respond with: "Sorry, my capabilities are only for helping in interview preparation."

PROBLEM GENERATION WORKFLOW:

1. For new users or when starting, first gather the following information if not already provided:
   - Target companies (Big Tech, startups, etc.)
   - Preferred programming languages (Python, Go, Java, etc.)
   - Preparation timeframe (e.g., 4 weeks, 8 weeks)
   - Current skill level (beginner, intermediate, advanced)
   - Specific topic/concept (if specified)
   - Target job title (Software Engineer, Senior Software Engineer, etc.)

2. Generate Problem with this structure:
   Problem Title: A clear, concise title
   
   Description: Clear explanation of the problem
   
   Example:
   Input: [format and example]
   Output: [expected result]
   Explanation: Why this is the output
   
   Constraints:
   - Time Complexity requirement
   - Space Complexity requirement
   - Input size limits
   - Value ranges

   Test Cases:
   [Generate exactly 3 test cases with increasing complexity. Format as follows:]
   
   Test Case 1:
   Input: [specific input values]
   Expected Output: [exact expected output]
   
   Test Case 2:
   Input: [specific input values]
   Expected Output: [exact expected output]
   
   Test Case 3:
   Input: [specific input values]
   Expected Output: [exact expected output]

   Note: Your solution must pass all three test cases to be considered correct.

IMPORTANT GUIDELINES:
1. Problem Characteristics:
   - Real-world applicable
   - Tests fundamental concepts
   - Clear and unambiguous
   - Gradually increasing complexity
   - Opportunity for optimization

2. Writing Style:
   - Professional and precise language
   - Consistent formatting
   - No ambiguous statements
   - Well-structured examples
   - Clear constraints

Remember: Focus only on generating the problem. Do not provide solutions or implementation hints unless specifically requested.
`

export async function POST(req: Request) {
  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = JSON.parse(user.value)
    const userId = userData.id

    const { message, sessionId, conversationHistory = [] } = await req.json()

    // Get or create chat session
    let chatSession = sessionId ? 
      await prisma.chatSession.findUnique({ where: { id: sessionId } }) :
      await prisma.chatSession.create({
        data: {
          userId: userId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '') // Initial title from user message
        }
      })

    if (!chatSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        sender: MessageSender.user,
        messageType: MessageType.general,
        message: message
      }
    })

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...conversationHistory,
      {
        role: "user",
        content: message
      }
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    })

    const aiResponse = completion.choices[0].message.content || ''

    // Update session title if this is the first message
    if (!sessionId && aiResponse) {
      // Extract a concise title from the AI's response
      const titlePrompt = `Create a very concise title (MAXIMUM 4 WORDS) for this chat based on my question: "${message}" and your response: "${aiResponse}". Return ONLY the title, nothing else.`
      const titleCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: titlePrompt }],
        temperature: 0.7,
        max_tokens: 50,
      })

      const suggestedTitle = titleCompletion.choices[0].message.content || ''
      
      // Update the session title
      chatSession = await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: { title: suggestedTitle.slice(0, 50) }
      })
    }

    // Analyze the response to determine message type
    const messageType = aiResponse.toLowerCase().includes('problem title:') 
      ? MessageType.question
      : MessageType.general

    // Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        sender: MessageSender.assistant,
        messageType,
        message: aiResponse
      }
    })

    const response = {
      message: aiResponse,
      sessionId: chatSession.id,
      messageId: assistantMessage.id,
      title: chatSession.title,
      conversationHistory: [
        ...conversationHistory,
        {
          role: "user",
          content: message
        },
        {
          role: "assistant",
          content: aiResponse
        }
      ]
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    )
  }
} 