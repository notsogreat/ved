import { NextResponse } from 'next/server';
import { QuestionService } from '@/lib/openai/services/question-service';

export async function POST(req: Request) {
  try {
    const { topic, difficulty } = await req.json();
    
    const result = await QuestionService.generateQuestion(topic, difficulty);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 