import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { code, language } = JSON.parse(event.body || '{}');
    
    if (language === 'go') {
      // Here you would implement Go code execution
      // For now, let's just return the code as output
      return {
        statusCode: 200,
        body: JSON.stringify({
          output: `Executing Go code:\n${code}`,
          error: null
        })
      };
    }
    
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: `Unsupported language: ${language}`
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    };
  }
}; 