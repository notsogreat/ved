import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { MessageSender, MessageType } from '@prisma/client'

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

    const { sessionId } = await req.json()

    // Create a basic session with provided ID and temporary title
    const chatSession = await prisma.chatSession.create({
      data: {
        id: sessionId,
        userId: userId,
        title: "New Chat Session" // Temporary title
      }
    })

    // // Save the initial message
    // await prisma.chatMessage.create({
    //   data: {
    //     sessionId: chatSession.id,
    //     sender: MessageSender.user,
    //     messageType: MessageType.general,
    //   }
    // })

    // Return the session ID immediately
    return NextResponse.json({ 
      sessionId: chatSession.id 
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
} 