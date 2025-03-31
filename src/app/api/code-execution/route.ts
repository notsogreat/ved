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
    console.log('Received request:', { code, language });

    const functionName = lambdaConfig.functionNames[language];
    if (!functionName) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // Different payload structure for Go vs Python
    const payload = language === 'go' 
      ? { code }  // Send code directly for Go
      : { body: JSON.stringify({ code, language }) };  // Keep existing structure for Python
    
    console.log('Sending to Lambda:', { functionName, payload });

    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: Buffer.from(JSON.stringify(payload)),
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
    if (language === 'python') {
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
    } else {
      // Handle Go Lambda response
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({
        output: result.output || '',
        error: result.error || null
      });
    }
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
} 