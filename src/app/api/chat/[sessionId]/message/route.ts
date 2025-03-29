import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { MessageSender, MessageType } from '@prisma/client'

export async function POST(req: Request, { params }: { params: { sessionId: string } }) {
  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = JSON.parse(user.value)
    const userId = userData.id

    const resolvedParams = await Promise.resolve(params)
    
    // Get sessionId from params safely
    const sessionId = resolvedParams?.sessionId || ""
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
    }

    // Verify session belongs to user
    const session = await prisma.chatSession.findUnique({
      where: {
        id: sessionId,
        userId: userId
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const { message, role } = await req.json()
    
    // Validate message content
    if (!message || message.trim() === '') {
      console.log('Skipping empty message for session:', sessionId);
      return NextResponse.json({ error: 'Empty message not allowed' }, { status: 400 });
    }

    // Determine message type based on content
    const messageType = message.toLowerCase().includes('problem title:') 
      ? MessageType.question
      : MessageType.general

    // Store the message
    const storedMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: role === 'user' ? MessageSender.user : MessageSender.assistant,
        messageType,
        message
      }
    })

    return NextResponse.json({
      messageId: storedMessage.id,
      message: storedMessage.message,
      role: storedMessage.sender === MessageSender.user ? 'user' : 'assistant'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    )
  }
} 