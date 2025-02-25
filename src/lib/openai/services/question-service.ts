import { openai, AIResponse, Question } from '../config';
import { generateQuestionPrompt, generateHintPrompt } from '../prompts/question-prompts';

export class QuestionService {
  static async generateQuestion(topic: string, difficulty: string): Promise<AIResponse<Question>> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a programming question generator. Generate questions in JSON format with the following structure:
{
  "title": "string",
  "description": "string",
  "examples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "constraints": ["string"],
  "testCases": [
    {
      "input": "string",
      "output": "string",
      "isHidden": boolean
    }
  ]
}
Ensure examples and testCases are arrays.`
          },
          {
            role: "user",
            content: `Generate a ${difficulty} level programming question about ${topic}. Return only valid JSON matching the specified structure.`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      console.log('OpenAI response:', response);

      const parsedData = JSON.parse(response);

      // Ensure examples is an array
      if (!Array.isArray(parsedData.examples)) {
        parsedData.examples = [parsedData.examples];
      }

      // Ensure testCases is an array
      if (!Array.isArray(parsedData.testCases)) {
        parsedData.testCases = [parsedData.testCases];
      }

      // Ensure constraints is an array
      if (!Array.isArray(parsedData.constraints)) {
        parsedData.constraints = [parsedData.constraints];
      }

      return {
        success: true,
        data: parsedData
      };
    } catch (error) {
      console.error('Error generating question:', error);
      return {
        success: false,
        error: 'Failed to generate question'
      };
    }
  }

  static async generateHint(question: string): Promise<AIResponse<string>> {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ 
          role: "user", 
          content: generateHintPrompt(question) 
        }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });

      return {
        success: true,
        data: completion.choices[0].message.content || ''
      };
    } catch (error) {
      console.error('Error generating hint:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate hint'
      };
    }
  }
} 