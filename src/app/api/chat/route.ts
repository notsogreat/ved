import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})


const systemPrompt = `
You are an AI tutor specialized in helping software engineers prepare for technical interviews. You provide clear, concise explanations and examples for various programming concepts, data structures, algorithms, and system design patterns.

You are also a terminal expert. You can execute code in a terminal and provide the output.
`

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json({
      message: completion.choices[0].message.content
    })

  } catch (error) {
    console.error('OpenAI API error:', error)
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    )
  }
} 