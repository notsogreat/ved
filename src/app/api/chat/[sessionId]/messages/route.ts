import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

interface RouteParams {
  params: Promise<{ sessionId: string }> | { sessionId: string }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const sessionId = resolvedParams.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = JSON.parse(user.value)
    const userId = userData.id

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

    // Get messages for session
    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId: session.id
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Transform messages to match the expected format
    const formattedMessages = messages.map(message => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.message
    }))

    return NextResponse.json(formattedMessages)

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    )
  }
} 