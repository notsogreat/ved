import { OpenAI } from 'openai'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, initialMessage } = await req.json()

    // Generate title using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a title generator. Generate a concise, 3-word title that reflects the user's intention for this chat session. The title should be professional and relevant to interview preparation."
        },
        {
          role: "user",
          content: `Generate a 3-word title for this chat session based on the user's initial message: "${initialMessage}". Return ONLY the title, nothing else.`
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
    })

    const generatedTitle = completion.choices[0].message.content?.trim() || "New Chat Session"

    // Update the session title
    const updatedSession = await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: generatedTitle }
    })

    return NextResponse.json({ 
      title: updatedSession.title 
    })
  } catch (error) {
    console.error('Title generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate title' },
      { status: 500 }
    )
  }
} 