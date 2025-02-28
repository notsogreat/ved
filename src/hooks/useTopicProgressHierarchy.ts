import { useState, useEffect } from 'react';
import { Status, Difficulty } from '@prisma/client';

interface TopicProgress {
  status: Status;
  progressPercentage: number;
  completedAt: Date | null;
  currentSubtopicId: string | null;
}

export interface TopicWithProgress {
  id: string;
  name: string;
  category: string;
  difficulty: Difficulty;
  description: string | null;
  prerequisites: string[];
  progress: TopicProgress;
  subtopics?: TopicWithProgress[];
}

export function useTopicProgressHierarchy(userId: string) {
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopicProgress = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/users/${userId}/topic-progress`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch topic progress');
        }

        const data = await response.json();
        setTopics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch topic progress');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchTopicProgress();
    }
  }, [userId]);

  return { topics, isLoading, error };
} 