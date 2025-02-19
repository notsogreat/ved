import { openai, AIResponse } from '../config';

export class CodeReviewService {
  static async reviewCode(code: string): Promise<AIResponse<string>> {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ 
          role: "user", 
          content: `Review the following code and provide feedback on improvements:
          
          ${code}` 
        }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });

      return {
        success: true,
        data: completion.choices[0].message.content || ''
      };
    } catch (error) {
      console.error('Error reviewing code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to review code'
      };
    }
  }
} 