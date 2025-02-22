'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { TopicProgress } from "./topic-progress"
import { Topic } from "@/config/topics"

interface VerticalProgressStepsProps {
  topics: Topic[]
  activeTopic?: string
  onTopicSelect: (topicName: string) => void
}

export function VerticalProgressSteps({ topics, activeTopic, onTopicSelect }: VerticalProgressStepsProps) {
  // This would normally come from your backend/state management
  const [progress, setProgress] = useState<{
    [key: string]: {
      status: 'not-started' | 'in-progress' | 'complete'
      progress?: number
    }
  }>({})

  // Simulate progress data - replace with real data in production
  useEffect(() => {
    const mockProgress = topics.reduce((acc, topic) => {
      acc[topic.name] = {
        status: topic.name === activeTopic ? 'in-progress' : 'not-started',
        progress: topic.name === activeTopic ? 60 : 0
      }
      
      if (topic.subtopics) {
        topic.subtopics.forEach((subtopic, index) => {
          if (topic.name === activeTopic) {
            acc[subtopic.name] = {
              status: index === 0 ? 'complete' : 
                      index === 1 ? 'in-progress' : 
                      'not-started',
              progress: index === 1 ? 45 : 0
            }
          } else {
            acc[subtopic.name] = {
              status: 'not-started',
              progress: 0
            }
          }
        })
      }
      
      return acc
    }, {} as typeof progress)

    setProgress(mockProgress)
  }, [topics, activeTopic])

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-2">
        {topics.map((topic, index) => (
          <TopicProgress
            key={index}
            topic={topic}
            isActive={topic.name === activeTopic}
            progress={progress}
            onSelect={() => onTopicSelect(topic.name)}
          />
        ))}
      </div>
    </Card>
  )
} 