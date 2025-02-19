import { Runtime } from '@aws-sdk/client-lambda'
import { exec } from 'child_process'
import { writeFile } from 'fs/promises'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function executeGo(code: string) {
  const tempFile = '/tmp/main.go'
  await writeFile(tempFile, code)
  return execAsync('go run /tmp/main.go')
}

async function executePython(code: string) {
  const tempFile = '/tmp/script.py'
  await writeFile(tempFile, code)
  return execAsync(`python3 ${tempFile}`)
}

export const handler = async (event: any) => {
  const { code, language } = JSON.parse(event.body)
  
  try {
    let result
    
    switch (language) {
      case 'go':
        // Create temp file and execute Go code
        result = await executeGo(code)
        break
      case 'python':
        // Execute Python code directly
        result = await executePython(code)
        break
      // Add other language handlers
      default:
        throw new Error('Unsupported language')
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        output: result.stdout,
        error: result.stderr
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: (error as Error).message
      })
    }
  }
} 