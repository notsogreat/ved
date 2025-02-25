import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { QuestionService } from '@/lib/openai/services/question-service';

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

const categoryMapping = {
  'data-structures': 'Data Structures',
  'algorithms': 'Algorithms',
  'system-design': 'System Design',
  'web-development': 'Web Development'
};

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    // Step 1: Validate user authentication
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Step 2: Get and map the category from URL parameters
    const resolvedParams = await Promise.resolve(params);
    const urlCategory = resolvedParams.id;
    const category = categoryMapping[urlCategory as keyof typeof categoryMapping];

    try {
      // Step 3: Find the main topic for the category
      const mainTopic = await prisma.topic.findFirst({
        where: {
          category: category,
          parentId: null
        },
        include: {
          children: true
        }
      });

      if (!mainTopic) {
        return NextResponse.json(
          { error: `No main topic found for category: ${category}` },
          { status: 404 }
        );
      }

      // Step 4: Get or create user progress for the main topic
      let progress = await prisma.progress.findUnique({
        where: {
          userId_topicId: {
            userId: userId,
            topicId: mainTopic.id
          }
        }
      });

      let targetTopicId;
      
      if (!progress) {
        // Step 5a: If no progress exists, start with the first subtopic
        const firstSubtopic = mainTopic.children[0];
        if (!firstSubtopic) {
          return NextResponse.json(
            { error: 'No subtopics available' },
            { status: 404 }
          );
        }

        try {
          progress = await prisma.progress.create({
            data: {
              userId: userId,
              topicId: mainTopic.id,
              currentSubtopicId: firstSubtopic.id,
              status: 'in_progress',
              progressPercentage: 0
            }
          });
          targetTopicId = firstSubtopic.id;
        } catch (createError) {
          return NextResponse.json({
            error: 'Failed to create progress',
            details: (createError as Error).message
          }, { status: 500 });
        }
      } else {
        // Step 5b: If progress exists, determine the current or next subtopic
        if (progress.currentSubtopicId) {
          targetTopicId = progress.currentSubtopicId;
        } else {
          // Find the next incomplete subtopic
          const completedSubtopics = await prisma.progress.findMany({
            where: {
              userId: userId,
              topicId: {
                in: mainTopic.children.map(child => child.id)
              },
              status: 'complete'
            }
          });

          const nextSubtopic = mainTopic.children.find(child => 
            !completedSubtopics.some(progress => progress.topicId === child.id)
          );

          if (!nextSubtopic) {
            return NextResponse.json(
              { error: 'All subtopics completed' },
              { status: 400 }
            );
          }

          // Update progress to track the new subtopic
          await prisma.progress.update({
            where: {
              id: progress.id
            },
            data: {
              currentSubtopicId: nextSubtopic.id
            }
          });

          targetTopicId = nextSubtopic.id;
        }
      }

      // Step 6: Get or generate a question for the target subtopic
      const question = await prisma.question.findFirst({
        where: {
          topicId: targetTopicId
        },
        include: {
          examples: true,
          testCases: {
            where: {
              isHidden: false
            }
          }
        }
      });

      if (!question) {
        // Step 7a: Generate new question if none exists
        const result = await QuestionService.generateQuestion(targetTopicId, 'beginner');
        
        if (!result.success) {
          return NextResponse.json({
            status: 'error',
            error: 'Failed to generate question',
            details: result.error
          }, { status: 500 });
        }

        // Step 7b: Save the generated question to database
        const newQuestion = await prisma.question.create({
          data: {
            topicId: targetTopicId,
            title: result.data?.title || 'Default Question Title',
            description: result.data?.description || 'Default Description',
            difficulty: 'beginner',
            constraints: result.data?.constraints || [],
            examples: {
              create: (result.data?.examples || []).map((example: any) => ({
                input: example.input || '',
                output: example.output || '',
                explanation: example.explanation || ''
              }))
            },
            testCases: {
              create: (result.data?.testCases || []).map((testCase: any) => ({
                input: testCase.input || '',
                expectedOutput: testCase.output || '',
                isHidden: testCase.isHidden || false
              }))
            }
          },
          include: {
            examples: true,
            testCases: {
              where: {
                isHidden: false
              }
            }
          }
        });

        // Step 8a: Return the newly generated question
        return NextResponse.json({
          status: 'success',
          data: {
            ...newQuestion,
            examples: newQuestion.examples || [],
            testCases: newQuestion.testCases || []
          }
        });
      }

      // Step 8b: Return the existing question
      return NextResponse.json({
        status: 'success',
        data: {
          ...question,
          examples: question.examples || [],
          testCases: question.testCases || []
        }
      });
    } catch (prismaError) {
      return NextResponse.json(
        { error: 'Database query failed', details: (prismaError as Error).message },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request', details: (error as Error).message },
      { status: 500 }
    );
  }
} 