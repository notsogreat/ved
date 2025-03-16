import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { MessageSender, MessageType, Prisma } from '@prisma/client'
import { extractJobTitle, generateInitialScores } from '@/lib/utils/scoring'

const chatSessionWithScores = Prisma.validator<Prisma.ChatSessionDefaultArgs>()({
  include: { user_performance_scores: true },
})

type ChatSessionWithScores = Prisma.ChatSessionGetPayload<typeof chatSessionWithScores>

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Helper function to extract areas needing improvement from evaluation messages
async function getAreasNeedingImprovement(sessionId: string): Promise<string[]> {
  const evaluationMessages = await prisma.chatMessage.findMany({
    where: {
      sessionId: sessionId,
      messageType: MessageType.evaluation
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 3 // Look at last 3 evaluations
  });

  const areas: string[] = [];
  for (const msg of evaluationMessages) {
    const content = msg.message;
    // Extract areas between "Areas Needing Improvement" and the next section
    const match = content.match(/Areas Needing Improvement([\s\S]*?)(?=Areas of Strength|Correct Solution|$)/i);
    if (match && match[1]) {
      // Split into bullet points and clean up
      const bulletPoints = match[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace('-', '').trim());
      areas.push(...bulletPoints);
    }
  }

  return [...new Set(areas)]; // Remove duplicates
}

// Helper function to get performance metrics that need improvement
async function getMetricsNeedingImprovement(sessionId: string): Promise<string[]> {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: { user_performance_scores: true }
  });

  if (!session?.user_performance_scores[0]) return [];

  console.log('Session:', session);
  console.log('User Performance Scores:', session.user_performance_scores);

  const targetScores = session.user_performance_scores[0];
  const evaluationMessages = await prisma.chatMessage.findMany({
    where: {
      sessionId: sessionId,
      messageType: MessageType.evaluation
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 1
  });

  if (!evaluationMessages[0]) return [];

  const content = evaluationMessages[0].message;
  console.log('Evaluation Message Content:', content);
  const metrics = [
    { name: 'Problem Understanding', field: 'problemUnderstanding' },
    { name: 'Data Structure & Algorithm Choice', field: 'dataStructureChoice' },
    { name: 'Time and Space Complexity', field: 'timeComplexity' },
    { name: 'Coding Style & Cleanliness', field: 'codingStyle' },
    { name: 'Correctness & Edge Cases', field: 'edgeCases' },
    { name: 'Language Usage', field: 'languageUsage' },
    { name: 'Communication', field: 'communication' },
    { name: 'Optimization', field: 'optimization' }
  ] as const;

  const needsImprovement: string[] = [];
  console.log('Starting metric comparison:');
  
  for (const metric of metrics) {
    // Updated regex to match the format "Metric Name (X/10)"
    const scoreMatch = content.match(new RegExp(`${metric.name}\\s*\\((\\d+)/10\\)`));
    if (scoreMatch) {
      const currentScore = parseInt(scoreMatch[1]);
      const targetScore = targetScores[metric.field];
      console.log(`Metric: ${metric.name}`);
      console.log(`- Current Score: ${currentScore}`);
      console.log(`- Target Score: ${targetScore}`);
      if (typeof targetScore === 'number' && currentScore < targetScore) {
        console.log(`- Needs improvement (${currentScore} < ${targetScore})`);
        needsImprovement.push(metric.name);
      } else {
        console.log('- Meets or exceeds target');
      }
    } else {
      console.log(`No score found for metric: ${metric.name}`);
    }
  }

  console.log('Metrics needing improvement:', needsImprovement);
  return needsImprovement;
}

const systemPrompt = `
You are Ved AI's problem generator, specialized in creating high-quality programming interview questions and helping software engineers prepare for technical interviews. 
Your role is to generate clear, well-structured programming problems that test important concepts.

For any question that is not related to interview preparation, respond with: "Sorry, my capabilities are only for helping in interview preparation."

PROBLEM GENERATION WORKFLOW:

1. For new users or when starting, ALWAYS gather the following information if not already provided:
   - Target job title (Software Engineer, Senior Software Engineer, etc.) - THIS IS REQUIRED
   - Target companies (Big Tech, startups, etc.)
   - Preferred programming languages (Python, Go, Java, etc.)
   - Preparation timeframe (e.g., 4 weeks, 8 weeks)
   - Current skill level (beginner, intermediate, advanced)
   - Specific topic/concept (if specified)

If the user hasn't provided their target job title, ALWAYS ask for it first before proceeding with any other response.
Example response for missing job title:
"To provide you with the most relevant interview questions, could you please let me know what job title you're targeting? (e.g., Software Engineer, Senior Software Engineer, Lead Software Engineer, etc.)"

2. Once you have the job title, Generate Problem with this structure:
   [ALWAYS START WITH 2 LINES EXPLAINING WHY THIS SPECIFIC PROBLEM WAS CHOSEN AND HOW IT WILL HELP THE USER IMPROVE]
   
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

3. Focus Areas:
   If areas needing improvement are provided, generate problems that specifically target these areas.
   For example:
   - If "optimization" needs improvement, focus on problems requiring efficient solutions
   - If "edge cases" needs improvement, include problems with tricky edge cases
   - If "communication" needs improvement, require detailed explanation of approach

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
    let chatSession: ChatSessionWithScores | null = null;
    
    if (!sessionId) {
      // Create the chat session first, without performance scores
      chatSession = await prisma.chatSession.create({
        data: {
          userId: userId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        },
        include: {
          user_performance_scores: true
        }
      }) as ChatSessionWithScores;
    } else {
      const existingSession = await prisma.chatSession.findUnique({ 
        where: { id: sessionId },
        include: {
          user_performance_scores: true
        }
      });

      if (existingSession) {
        chatSession = existingSession as ChatSessionWithScores;

        // Only try to extract and create performance scores if we don't have them yet
        if (chatSession.user_performance_scores.length === 0) {
          console.log('Attempting to create performance scores for session:', chatSession.id);
          
          // Function to extract role information from conversation
          const findRoleInformation = (history: any[]) => {
            // First check the current message
            const currentMessageTitle = extractJobTitle(message);
            if (currentMessageTitle) {
              return { title: currentMessageTitle, isValid: true };
            }

            // Then scan through conversation history
            for (let i = history.length - 1; i >= 0; i--) {
              const msg = history[i];
              
              // Check assistant responses for role acknowledgment
              if (msg.role === 'assistant' && 
                  msg.content.toLowerCase().includes('software engineer') &&
                  !msg.content.toLowerCase().includes('what job title')) {
                const roleMatch = msg.content.match(/for\s+(?:a|the)\s+(.*?(?:engineer|developer).*?)(?:\s+role|\.|,)/i);
                if (roleMatch) {
                  return { title: roleMatch[1], isValid: true };
                }
              }
              
              // Check user messages for role mention
              if (msg.role === 'user') {
                const userMessageTitle = extractJobTitle(msg.content);
                if (userMessageTitle) {
                  return { title: userMessageTitle, isValid: true };
                }
              }
            }
            
            return { title: '', isValid: false };
          };

          // Find role information from conversation
          const { title: potentialJobTitle, isValid } = findRoleInformation(conversationHistory);
          
          console.log('Job title extraction results:', {
            extractedTitle: potentialJobTitle,
            isValid,
            fromConversationHistory: true,
            messageCount: conversationHistory.length
          });
          
          // Create performance scores if we found a valid job title
          if (potentialJobTitle && isValid) {
            console.log('Creating performance scores with job title:', potentialJobTitle);
            const scores = generateInitialScores(potentialJobTitle, userId, chatSession.id);
            await prisma.user_performance_scores.create({
              data: {
                id: scores.id,
                user_id: scores.user_id,
                session_id: scores.session_id,
                problemUnderstanding: scores.problemUnderstanding,
                dataStructureChoice: scores.dataStructureChoice,
                timeComplexity: scores.timeComplexity,
                codingStyle: scores.codingStyle,
                edgeCases: scores.edgeCases,
                languageUsage: scores.languageUsage,
                communication: scores.communication,
                optimization: scores.optimization,
                totalScore: scores.totalScore,
                targetJobTitle: scores.targetJobTitle
              }
            });
            console.log('Successfully created performance scores for job title:', potentialJobTitle);

            // Refresh the session to include the new performance scores
            const updatedSession = await prisma.chatSession.findUnique({
              where: { id: sessionId },
              include: { user_performance_scores: true }
            });
            
            if (updatedSession) {
              chatSession = updatedSession as ChatSessionWithScores;
            }
          }
        }
      }
    }

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

    // If we don't have performance scores yet, force the AI to ask for job title
    const hasPerformanceScores = chatSession.user_performance_scores.length > 0;
    let effectiveSystemPrompt = !hasPerformanceScores
      ? systemPrompt + "\n\nIMPORTANT: The user hasn't provided their job title. Ask for it before proceeding with any other response."
      : systemPrompt;

    // If we have performance scores, check areas needing improvement
    if (hasPerformanceScores) {
      console.log('Checking areas and metrics needing improvement for session:', chatSession.id);
      
      const [areasNeedingImprovement, metricsNeedingImprovement] = await Promise.all([
        getAreasNeedingImprovement(chatSession.id),
        getMetricsNeedingImprovement(chatSession.id)
      ]);

      console.log('Areas and metrics analysis:', {
        areasNeedingImprovement,
        metricsNeedingImprovement,
        hasAreas: areasNeedingImprovement.length > 0,
        hasMetrics: metricsNeedingImprovement.length > 0,
        totalImprovementAreas: areasNeedingImprovement.length + metricsNeedingImprovement.length
      });

      if (areasNeedingImprovement.length > 0 || metricsNeedingImprovement.length > 0) {
        effectiveSystemPrompt += "\n\nIMPORTANT: Focus on the following areas that need improvement:\n";
        
        if (areasNeedingImprovement.length > 0) {
          console.log('Adding specific areas to focus on:', areasNeedingImprovement);
          effectiveSystemPrompt += "\nSpecific Areas:\n" + areasNeedingImprovement.map(area => `- ${area}`).join('\n');
        }
        
        if (metricsNeedingImprovement.length > 0) {
          console.log('Adding metrics to improve:', metricsNeedingImprovement);
          effectiveSystemPrompt += "\nMetrics to Improve:\n" + metricsNeedingImprovement.map(metric => `- ${metric}`).join('\n');
        }
        
        effectiveSystemPrompt += "\n\nGenerate a problem that specifically targets these areas for improvement.";
      } else {
        console.log('No specific areas or metrics needing improvement found. Generating a balanced question.');
      }
    } else {
      console.log('No performance scores yet. Will prompt for job title.');
    }

    const messages = [
      {
        role: "system",
        content: effectiveSystemPrompt
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
      }) as ChatSessionWithScores;
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