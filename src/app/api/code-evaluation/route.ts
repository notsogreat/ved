import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

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
    const { code, problem, targetJobTitle } = await req.json()

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

    return NextResponse.json({
      evaluation: completion.choices[0].message.content
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'There was an error evaluating your code' },
      { status: 500 }
    )
  }
} 