'use client'

import { useEffect, useState } from 'react'
import { Card } from "@/components/ui/card"
import { TopicProgress } from "./topic-progress"
import { Topic } from "@/config/topics"
import { useTopicProgressHierarchy } from '@/hooks/useTopicProgressHierarchy'
import { transformProgressData, UIProgress } from '@/lib/utils/progress'
import { Skeleton } from '@/components/ui/skeleton'

interface VerticalProgressStepsProps {
  topics: Topic[]
  activeTopic?: string
  onTopicSelect: (topicName: string) => void
}

export function VerticalProgressSteps({ 
  topics, 
  activeTopic, 
  onTopicSelect 
}: VerticalProgressStepsProps) {
  const [progress, setProgress] = useState<UIProgress>({})
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null
  const { topics: topicsWithProgress, isLoading, error } = useTopicProgressHierarchy(userId || '')

  useEffect(() => {
    if (topicsWithProgress.length > 0) {
      const transformedProgress = transformProgressData(topicsWithProgress)
      setProgress(transformedProgress)
    }
  }, [topicsWithProgress])

  if (isLoading) {
    return (
      <Card className="p-4 bg-card">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <div className="pl-8 space-y-2">
                <Skeleton className="h-8 w-[90%]" />
                <Skeleton className="h-8 w-[85%]" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4 bg-card">
        <div className="text-sm text-destructive">
          Failed to load progress. Please try again later.
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-card">
      <div className="space-y-2">
        {topics.map((topic, index) => (
          <TopicProgress
            key={index}
            topic={topic}
            isActive={topic.name === activeTopic}
            progress={progress}
            onSelect={onTopicSelect}
          />
        ))}
      </div>
    </Card>
  )
} 