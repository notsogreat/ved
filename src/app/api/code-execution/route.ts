import { NextResponse } from 'next/server';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import lambdaConfig from '@/config/lambda';

const lambda = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { code, language } = await request.json();
    console.log('Invoking Lambda with:', { code, language });

    const functionName = lambdaConfig.functionNames[language];
    if (!functionName) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify({ 
        body: JSON.stringify({ code, language })
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

    // Handle Lambda response format
    if (result.statusCode === 200) {
      const body = JSON.parse(result.body);
      return NextResponse.json({
        output: body.output || '',
        error: body.error || null
      });
    } else {
      const body = JSON.parse(result.body);
      return NextResponse.json(
        { error: body.error || 'Unknown error occurred' },
        { status: result.statusCode }
      );
    }
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
} 