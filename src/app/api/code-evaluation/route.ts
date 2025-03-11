import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const evaluationPrompt = `
You are Ved AI's code evaluator. Your task is to evaluate the candidate's code solution for the given programming problem.

Evaluation Criteria (Score out of 10 for each):

1. Problem Understanding (10 points)
   - Complete understanding of requirements
   - Correct interpretation of constraints
   - Recognition of edge cases

2. Algorithm Choice (10 points)
   - Selection of appropriate algorithm
   - Consideration of alternatives
   - Justification of choice

3. Time and Space Complexity (10 points)
   - Correct complexity analysis
   - Optimization considerations
   - Memory usage efficiency

4. Coding Style & Cleanliness (10 points)
   - Code organization
   - Naming conventions
   - Comments and documentation
   - Consistent formatting

5. Correctness & Edge Cases (10 points)
   - Passes all test cases
   - Handles edge cases
   - Input validation

6. Language Usage (10 points)
   - Idiomatic code
   - Proper use of language features
   - Best practices followed

7. Communication (10 points)
   - Clear code comments
   - Explanation of approach
   - Trade-off discussion

8. Optimization Thinking (10 points)
   - Identification of bottlenecks
   - Optimization suggestions
   - Performance considerations

Please provide:
1. Detailed score breakdown with justification for each criterion
2. Total score out of 80
3. Specific feedback and improvement suggestions
4. Confidence level (0-100%) for the target job title based on this solution
5. Areas of strength
6. Areas needing improvement

Format your response in markdown for better readability.
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

    const { code, problem, targetJobTitle, sessionId, codeSubmissionId } = await req.json() as {
      code: string;
      problem: string;
      targetJobTitle: string;
      sessionId: string;
      codeSubmissionId?: string;
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: evaluationPrompt
      },
      {
        role: "user",
        content: `
Problem:
${problem}

Candidate's Code:
${code}

Target Job Title: ${targetJobTitle}

Please evaluate the solution based on the given criteria.
`
      }
    ]

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const evaluationContent = completion.choices[0].message.content

    // Save the evaluation as a chat message
    const chatMessageData: any = {
      sessionId,
      sender: 'assistant',
      messageType: 'evaluation',
      message: evaluationContent,
    }
    
    // Only add codeSubmissionId if it exists
    if (codeSubmissionId) {
      chatMessageData.codeSubmissionId = codeSubmissionId;
    }

    const evaluationMessage = await prisma.chatMessage.create({
      data: chatMessageData
    })

    // If a code submission ID was provided, update the code submission with the evaluation
    if (codeSubmissionId) {
      await prisma.codeSubmission.update({
        where: { id: codeSubmissionId },
        data: {
          evaluation: { connect: { id: evaluationMessage.id } }
        }
      })
    }

    return NextResponse.json({
      evaluation: evaluationContent,
      evaluationId: evaluationMessage.id
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'There was an error evaluating your code' },
      { status: 500 }
    )
  }
} 