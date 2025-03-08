import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = JSON.parse(user.value)
    const userId = userData.id
    const sessionId = params.sessionId

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

    // Get latest code submission for the session
    const codeSubmission = await prisma.codeSubmission.findFirst({
      where: {
        sessionId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ codeSubmission })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'There was an error fetching your code' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Get user from cookie
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = JSON.parse(user.value)
    const userId = userData.id
    const sessionId = params.sessionId

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

    console.log('Received code submission:', { sessionId, userId })

    const { code, language } = await request.json()
    console.log('Received code submission:', { code, language })

    // Find the last question message in the session
    const lastQuestionMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId,
        messageType: 'question'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!lastQuestionMessage) {
      return NextResponse.json(
        { error: 'No question message found in this session' },
        { status: 400 }
      )
    }

    // Save code submission
    const codeSubmission = await prisma.codeSubmission.create({
      data: {
        sessionId,
        chatMessageId: lastQuestionMessage.id,
        language,
        code,
      }
    })

    return NextResponse.json({ success: true, codeSubmission })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'There was an error saving your code' },
      { status: 500 }
    )
  }
} 