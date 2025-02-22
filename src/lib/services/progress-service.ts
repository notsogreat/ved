import { prisma } from '@/lib/db/prisma'
import type { Status } from '@prisma/client'

export class ProgressService {
  static async getUserProgress(userId: string) {
    return prisma.progress.findMany({
      where: { userId },
      include: {
        topic: true,
        subtopic: true
      },
      orderBy: [
        { topic: { name: 'asc' } },
        { subtopic: { name: 'asc' } }
      ]
    })
  }

  static async updateProgress(
    userId: string,
    topicId: string,
    subtopicId: string | null,
    status: Status,
    progressPercentage: number
  ) {
    return prisma.progress.upsert({
      where: {
        userId_topicId_subtopicId: {
          userId,
          topicId,
          subtopicId
        }
      },
      update: {
        status,
        progressPercentage,
        updatedAt: new Date()
      },
      create: {
        userId,
        topicId,
        subtopicId,
        status,
        progressPercentage
      }
    })
  }
} 