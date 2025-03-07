import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const user = cookieStore.get('user')
    if (!user?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = JSON.parse(user.value)
    const userId = userData.id

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            message: true,
            sender: true
          }
        }
      }
    })

    // Transform the data to ensure all fields are present
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: (session.title || 'Untitled Chat').replace(/^"|"$/g, ''),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
      messages: session.messages
    }))

    return NextResponse.json(formattedSessions)
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    )
  }
} 