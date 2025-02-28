import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Topic, Status } from '@prisma/client';

type TopicProgress = {
  status: Status;
  progressPercentage: number;
  completedAt: Date | null;
  currentSubtopicId: string | null;
};

type TopicWithProgress = Topic & {
  progress: TopicProgress[];
  children: Array<Topic & { progress: TopicProgress[] }>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const topicsWithProgress = await prisma.topic.findMany({
      include: {
        progress: {
          where: { userId: params.userId },
          select: {
            status: true,
            progressPercentage: true,
            completedAt: true,
            currentSubtopicId: true,
          },
        },
        children: {
          include: {
            progress: {
              where: { userId: params.userId },
              select: {
                status: true,
                progressPercentage: true,
                completedAt: true,
                currentSubtopicId: true,
              },
            },
          },
        },
      },
      where: { parentId: null },
      orderBy: { id: 'asc' },
    }) as unknown as TopicWithProgress[];

    const transformedTopics = topicsWithProgress.map(topic => ({
      id: topic.id,
      name: topic.name,
      category: topic.category,
      difficulty: topic.difficulty,
      description: topic.description,
      prerequisites: topic.prerequisites,
      progress: topic.progress[0] || {
        status: 'not_started' as Status,
        progressPercentage: 0,
        completedAt: null,
        currentSubtopicId: null,
      },
      subtopics: topic.children.map(child => ({
        id: child.id,
        name: child.name,
        category: child.category,
        difficulty: child.difficulty,
        description: child.description,
        prerequisites: child.prerequisites,
        progress: child.progress[0] || {
          status: 'not_started' as Status,
          progressPercentage: 0,
          completedAt: null,
          currentSubtopicId: null,
        },
      })),
    }));

    return NextResponse.json(transformedTopics);
  } catch (error) {
    console.error('Error fetching topic progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topic progress' },
      { status: 500 }
    );
  }
} 