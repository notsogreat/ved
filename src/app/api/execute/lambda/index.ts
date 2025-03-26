import { Runtime } from '@aws-sdk/client-lambda'
import { exec } from 'child_process'
import { writeFile } from 'fs/promises'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ExecError extends Error {
  killed?: boolean;
}

async function executeGo(code: string) {
  const tempFile = '/tmp/main.go'
  await writeFile(tempFile, code)
  return execAsync('go run /tmp/main.go')
}

async function executePython(code: string) {
  // Create a temporary Python file
  const tempFile = '/tmp/script.py'
  
  // Format the code to ensure it's executable
  const formattedCode = `
import sys
import traceback

try:
${code.split('\n').map(line => '    ' + line).join('\n')}
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
`
  
  await writeFile(tempFile, formattedCode)
  
  // Execute the Python code with a timeout
  try {
    const result = await execAsync(`python3 ${tempFile}`, {
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    })
    return result
  } catch (error) {
    const execError = error as ExecError
    if (execError.killed) {
      return {
        stdout: '',
        stderr: 'Execution timed out after 10 seconds'
      }
    }
    throw error
  }
}

export const handler = async (event: any) => {
  try {
    const { code, language } = JSON.parse(event.body || event)
    
    if (!code || !language) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required parameters: code and language'
        })
      }
    }

    let result
    
    switch (language) {
      case 'go':
        result = await executeGo(code)
        break
      case 'python':
        result = await executePython(code)
        break
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: `Unsupported language: ${language}`
          })
        }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        output: result.stdout,
        error: result.stderr
      })
    }
  } catch (error) {
    console.error('Lambda execution error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: (error as Error).message
      })
    }
  }
} 