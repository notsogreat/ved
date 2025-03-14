import { v4 as uuidv4 } from 'uuid';

export type JobLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead';

interface ScoreMatrix {
  problemUnderstanding: number;
  dataStructureChoice: number;
  timeComplexity: number;
  codingStyle: number;
  edgeCases: number;
  languageUsage: number;
  communication: number;
  optimization: number;
}

// Base score matrix for different job levels
const baseScoreMatrix: Record<JobLevel, ScoreMatrix> = {
  Junior: {
    problemUnderstanding: 6,
    dataStructureChoice: 6,
    timeComplexity: 5,
    codingStyle: 7,
    edgeCases: 6,
    languageUsage: 7,
    communication: 7,
    optimization: 5
  },
  Mid: {
    problemUnderstanding: 7,
    dataStructureChoice: 7,
    timeComplexity: 7,
    codingStyle: 8,
    edgeCases: 7,
    languageUsage: 8,
    communication: 8,
    optimization: 7
  },
  Senior: {
    problemUnderstanding: 8,
    dataStructureChoice: 8,
    timeComplexity: 8,
    codingStyle: 9,
    edgeCases: 8,
    languageUsage: 9,
    communication: 9,
    optimization: 8
  },
  Lead: {
    problemUnderstanding: 9,
    dataStructureChoice: 9,
    timeComplexity: 9,
    codingStyle: 9,
    edgeCases: 9,
    languageUsage: 9,
    communication: 9,
    optimization: 9
  }
};

// Job title to level mapping
const jobTitleToLevel: Record<string, JobLevel> = {
  'junior software engineer': 'Junior',
  'software engineer': 'Mid',
  'senior software engineer': 'Senior',
  'lead software engineer': 'Lead',
  'tech lead': 'Lead',
  'junior developer': 'Junior',
  'developer': 'Mid',
  'senior developer': 'Senior',
  'lead developer': 'Lead',
  // Add more mappings as needed
};

export function determineJobLevel(jobTitle: string): JobLevel {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  return jobTitleToLevel[normalizedTitle] || 'Mid'; // Default to Mid level if unknown
}

export function generateInitialScores(jobTitle: string, userId: string, sessionId: string) {
  const jobLevel = determineJobLevel(jobTitle);
  const baseScores = baseScoreMatrix[jobLevel];
  
  return {
    id: uuidv4(),
    user_id: userId,
    session_id: sessionId,
    targetJobTitle: jobTitle,
    ...baseScores,
    totalScore: Object.values(baseScores).reduce((a, b) => a + b, 0)
  };
}

// Extract job title from user's message
export function extractJobTitle(message: string): string {
  const defaultTitle = 'Software Engineer';
  
  // Common patterns for job title mentions
  const patterns = [
    /(?:for|as|position|role|job|title).*?(junior|senior|lead|principal)?\s*(software engineer|developer|engineer|programmer)/i,
    /(junior|senior|lead|principal)?\s*(software engineer|developer|engineer|programmer)/i
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const title = match[0].replace(/^(?:for|as|position|role|job|title)\s*/, '').trim();
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
  }

  return defaultTitle;
} 