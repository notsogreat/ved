import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const evaluationPrompt = `
You are Ved AI's code evaluator. Your task is to evaluate my code solution for the given programming problem.

Evaluation Criteria (Score out of 10 for each):

1. Problem Understanding (10 points)
 - Did you fully understand the problem and constraints?
2. Data Structure & Algorithm Choice (10 points)
 - Did you choose the best data structure and algorithm for the problem?
3. Time and Space Complexity (10 points)
 - Did you consider the time and space complexity of your solution?
4. Coding Style & Cleanliness (10 points)
 - Is your code clean and easy to understand?
5. Correctness & Edge Cases (10 points)
 - Did you handle all edge cases?
6. Language Usage (10 points)
 - Did you use the language correctly?
7. Communication (10 points)
 - Did you communicate your thoughts clearly?
8. Optimization Thinking (10 points)
 - Did you consider the optimization of your solution?

Please provide:
1. Scores for each criterion (without detailed justification)
2. Total score out of 80
3. Specific feedback and improvement suggestions
4. Confidence level (0-100%) for the target job title based on this solution
5. Areas of strength
6. Areas needing improvement
7. Correct solution in the format of the my code:
   \`\`\`<language>
   // Your solution here with proper <language> types
   \`\`\`

Format your response in markdown for better readability.
`

const generateFeedback = (currentScores: any, targetScores: any) => {
  const metrics = [
    'problemUnderstanding',
    'dataStructureChoice',
    'timeComplexity',
    'codingStyle',
    'edgeCases',
    'languageUsage',
    'communication',
    'optimization'
  ];

  const achievedTargets = metrics.filter(metric => 
    currentScores[metric] >= targetScores[metric]
  );

  const totalAchieved = achievedTargets.length;
  const isReadyForInterview = totalAchieved >= 6; // If achieved 6 or more targets

  const encouragingQuotes = [
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Your hard work has paid off! You're ready to take on any technical challenge.",
    "Believe in yourself. You've proven you have what it takes!",
    "The best way to predict the future is to create it. You're well on your way!",
    "Your dedication to improvement shows. You're ready for the next step!"
  ];

  if (isReadyForInterview) {
    const randomQuote = encouragingQuotes[Math.floor(Math.random() * encouragingQuotes.length)];
    return `\n\n🎉 **Congratulations!** Based on your performance metrics, you've achieved or exceeded the target scores in ${totalAchieved} out of 8 areas. You're showing strong readiness for your target role.\n\n> ${randomQuote}\n\nYou're well-prepared for technical interviews. Keep up the great work!`;
  }

  return `\n\nYou've achieved the target scores in ${totalAchieved} out of 8 areas. Keep practicing and focusing on improvement in the remaining areas. You're making good progress!`;
};

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

    // Verify session belongs to user and get target scores
    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId
      },
      include: {
        user_performance_scores: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const targetScores = session.user_performance_scores[0];
    if (!targetScores) {
      return NextResponse.json({ error: 'Performance targets not found' }, { status: 404 })
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

My Code:
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

    const evaluationContent = completion.choices[0].message.content;
    if (!evaluationContent) {
      throw new Error('No evaluation content received');
    }

    // Extract scores from the evaluation
    const scoreRegex = /(\d+)(?=\s*points?|\s*\/\s*10)/g;
    const scores = evaluationContent.match(scoreRegex);
    
    if (!scores || scores.length < 8) {
      throw new Error('Could not extract scores from evaluation');
    }

    // Create current scores object
    const currentScores = {
      problemUnderstanding: parseInt(scores[0]),
      dataStructureChoice: parseInt(scores[1]),
      timeComplexity: parseInt(scores[2]),
      codingStyle: parseInt(scores[3]),
      edgeCases: parseInt(scores[4]),
      languageUsage: parseInt(scores[5]),
      communication: parseInt(scores[6]),
      optimization: parseInt(scores[7])
    };

    // Generate feedback comparing current scores with target scores
    const feedback = generateFeedback(currentScores, targetScores);

    // Append the feedback to the evaluation
    const evaluationWithFeedback = evaluationContent + feedback;

    // Save the evaluation as a chat message
    const chatMessageData: any = {
      sessionId,
      sender: 'assistant',
      messageType: 'evaluation',
      message: evaluationWithFeedback,
    }
    
    if (codeSubmissionId) {
      chatMessageData.codeSubmissionId = codeSubmissionId;
    }

    const evaluationMessage = await prisma.chatMessage.create({
      data: chatMessageData
    })

    return NextResponse.json({ evaluation: evaluationWithFeedback })

  } catch (error) {
    console.error('Evaluation error:', error)
    return NextResponse.json(
      { error: 'There was an error evaluating your code' },
      { status: 500 }
    )
  }
} 