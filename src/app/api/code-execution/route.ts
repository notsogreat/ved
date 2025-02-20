import { NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambda = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    console.log('Invoking Lambda with:', { code });

    const command = new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME!,
      Payload: Buffer.from(JSON.stringify({ 
        code
      })),
    });

    const response = await lambda.send(command);
    console.log('Lambda response:', response);
    
    if (response.FunctionError) {
      console.error('Lambda execution failed:', response.FunctionError);
      return NextResponse.json(
        { error: `Lambda execution failed: ${response.FunctionError}` },
        { status: 500 }
      );
    }

    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    console.log('Parsed result:', result);

    return NextResponse.json({
      output: result.output || '',
      error: result.error || null
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
} 