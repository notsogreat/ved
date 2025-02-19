import { openai, AIResponse, Question } from '../config';
import { generateQuestionPrompt, generateHintPrompt } from '../prompts/question-prompts';

export class QuestionService {
  static async generateQuestion(topic: string, difficulty: string): Promise<AIResponse<Question>> {
    try {
      const completion = await openai.chat.completions.create({
        messages: [{ 
          role: "user", 
          content: generateQuestionPrompt(topic, difficulty) 
        }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      });

      const response = completion.choices[0].message.content;
      return {
        success: true,
        data: JSON.parse(response || '{}')
      };
    } catch (error) {
      console.error('Error generating question:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate question'
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