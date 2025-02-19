import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Common types
export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Question {
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    output: string;
  }>;
} 