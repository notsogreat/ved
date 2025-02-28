import { Status } from '@prisma/client';
import { TopicWithProgress } from '@/hooks/useTopicProgressHierarchy';
import { AllTopics } from '@/config/topics';

export type UIProgressStatus = 'not-started' | 'in-progress' | 'complete';

export interface UIProgress {
  [key: string]: {
    status: UIProgressStatus;
    progress: number;
    topicId?: string;
    currentSubtopicId?: string | null;
  };
}

// Map topic IDs to display names
const topicDisplayNames: { [key: string]: string } = {
  'ds-arrays-strings': 'Arrays & Strings',
  'ds-basic-array': 'Basic Array Operations',
  // Add more mappings as needed
};

export function transformProgressData(topics: TopicWithProgress[]): UIProgress {
  const progress: UIProgress = {};

  topics.forEach((topic) => {
    const displayName = topicDisplayNames[topic.id] || topic.name;
    
    // Transform main topic progress
    progress[displayName] = {
      status: transformStatus(topic.progress.status),
      progress: topic.progress.progressPercentage,
      topicId: topic.id,
      currentSubtopicId: topic.progress.currentSubtopicId,
    };

    // Transform subtopic progress if they exist
    if (topic.subtopics) {
      topic.subtopics.forEach((subtopic) => {
        const subtopicDisplayName = topicDisplayNames[subtopic.id] || subtopic.name;
        progress[subtopicDisplayName] = {
          status: transformStatus(subtopic.progress.status),
          progress: subtopic.progress.progressPercentage,
          topicId: subtopic.id,
        };

        // If this subtopic is the current one in progress, update its status
        if (topic.progress.currentSubtopicId === subtopic.id) {
          progress[subtopicDisplayName].status = 'in-progress';
        }
      });
    }
  });

  return progress;
}

function transformStatus(status: Status): UIProgressStatus {
  switch (status) {
    case 'not_started':
      return 'not-started';
    case 'in_progress':
      return 'in-progress';
    case 'complete':
      return 'complete';
    default:
      return 'not-started';
  }
} 