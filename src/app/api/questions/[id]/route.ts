import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { QuestionService } from '@/lib/openai/services/question-service';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const resolvedParams = await Promise.resolve(params);
  const topicId = resolvedParams.id;

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  console.log('topic id', topicId);

  try {
    // First fetch the topic
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        questions: {
          include: {
            examples: true,
            testCases: true
          },
          take: 1
        }
      }
    });

    console.log('found topic', topic);
    
    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Return existing question if found
    if (topic.questions.length > 0) {
      return NextResponse.json(topic.questions[0]);
    }

    // Generate new question
    const result = await QuestionService.generateQuestion(topicId, topic.difficulty);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    const data = result.data ?? {
      title: '',
      description: '',
      constraints: [],
      examples: [],
      testCases: []
    };

    // Create new question
    const question = await prisma.question.create({
      data: {
        topicId: topicId,
        title: data.title,
        description: data.description,
        difficulty: topic.difficulty,
        constraints: data.constraints,
        examples: {
          create: data.examples.map((example: any) => ({
            input: example.input,
            output: example.output,
            explanation: example.explanation
          }))
        },
        testCases: {
          create: data.testCases.map((testCase: any) => ({
            input: testCase.input,
            expectedOutput: testCase.output,
            isHidden: testCase.isHidden || false
          }))
        }
      },
      include: {
        examples: true,
        testCases: true
      }
    });

    // Create or update progress for this topic
    await prisma.progress.upsert({
      where: {
        userId_topicId: {
          userId: userId,
          topicId: topicId
        }
      },
      create: {
        userId: userId,
        topicId: topicId,
        status: 'not_started',
        progressPercentage: 0
      },
      update: {
        status: 'in_progress',
        progressPercentage: 0
      }
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 