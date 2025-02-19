import { NextResponse } from 'next/server'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'

const lambda = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: Request) {
  try {
    const { code, language_id } = await req.json()
    
    // Map language_id to language name
    const language = language_id === 60 ? 'go' : 'python' // Add more mappings as needed
    
    const command = new InvokeCommand({
      FunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      Payload: JSON.stringify({
        body: JSON.stringify({ code, language })
      }),
    })

    const { Payload } = await lambda.send(command)
    const result = JSON.parse(new TextDecoder().decode(Payload))
    const { body } = JSON.parse(result)
    
    return NextResponse.json(JSON.parse(body))

  } catch (error) {
    console.error('Code execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    )
  }
} 