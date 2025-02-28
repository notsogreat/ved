'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, CheckCircle2, Circle, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Topic } from "@/config/topics"
import { UIProgress } from '@/lib/utils/progress'
import { Badge } from "@/components/ui/badge"

interface TopicProgressProps {
  topic: Topic
  isActive: boolean
  progress: UIProgress
  onSelect: (topicName: string) => void
}

interface SubtopicItemProps {
  name: string
  status: 'not-started' | 'in-progress' | 'complete'
  progress: number
  isCurrentSubtopic: boolean
  onClick: () => void
}

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="mt-2 w-full">
    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
      <div
        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
    <span className="text-xs text-muted-foreground mt-1">{progress}% Complete</span>
  </div>
)

function SubtopicItem({
  name,
  status,
  progress,
  isCurrentSubtopic,
  onClick
}: SubtopicItemProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "ml-8 mb-2 last:mb-0 w-full justify-start p-3 h-auto hover:bg-muted/50 group",
        isCurrentSubtopic && "bg-blue-500/5 hover:bg-blue-500/10"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="flex-shrink-0">
          {status === 'complete' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : isCurrentSubtopic ? (
            <CircleDot className="h-4 w-4 text-blue-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "text-sm font-medium truncate",
              status === 'complete' ? "text-green-500" :
              isCurrentSubtopic ? "text-blue-500" :
              "text-muted-foreground"
            )}>
              {name}
            </span>
            {isCurrentSubtopic && (
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs shrink-0">
                Current
              </Badge>
            )}
          </div>
          {isCurrentSubtopic && progress > 0 && <ProgressBar progress={progress} />}
        </div>
      </div>
    </Button>
  )
}

export function TopicProgress({ topic, isActive, progress, onSelect }: TopicProgressProps) {
  const [isExpanded, setIsExpanded] = useState(isActive)
  const topicProgress = progress[topic.name] || { status: 'not-started', progress: 0 }
  const currentSubtopicId = topicProgress.currentSubtopicId

  const handleClick = () => {
    setIsExpanded(!isExpanded)
    onSelect(topic.name)
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between p-4 h-auto hover:bg-muted/50",
          topicProgress.status === 'in-progress' && "bg-blue-500/5 hover:bg-blue-500/10"
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0">
            {topicProgress.status === 'complete' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : topicProgress.status === 'in-progress' ? (
              <CircleDot className="h-5 w-5 text-blue-500" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                "font-medium truncate",
                topicProgress.status === 'complete' ? "text-green-500" :
                topicProgress.status === 'in-progress' ? "text-blue-500" :
                "text-muted-foreground"
              )}>
                {topic.name}
              </span>
              {currentSubtopicId && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs shrink-0">
                  In Progress
                </Badge>
              )}
            </div>
            {topicProgress.status === 'in-progress' && topicProgress.progress > 0 && (
              <ProgressBar progress={topicProgress.progress} />
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform flex-shrink-0 text-muted-foreground",
          isExpanded && "transform rotate-180"
        )} />
      </Button>

      <AnimatePresence>
        {isExpanded && topic.subtopics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {topic.subtopics.map((subtopic, index) => {
                const subtopicProgress = progress[subtopic.name] || { status: 'not-started', progress: 0 }
                const isCurrentSubtopic = subtopicProgress.topicId === currentSubtopicId
                
                return (
                  <SubtopicItem
                    key={index}
                    name={subtopic.name}
                    status={subtopicProgress.status}
                    progress={subtopicProgress.progress}
                    isCurrentSubtopic={isCurrentSubtopic}
                    onClick={() => onSelect(subtopic.name)}
                  />
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
} 