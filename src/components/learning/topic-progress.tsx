'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, CheckCircle2, Circle, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Topic } from "@/config/topics"

interface TopicProgressProps {
  topic: Topic
  isActive: boolean
  progress: {
    [key: string]: {
      status: 'not-started' | 'in-progress' | 'complete'
      progress?: number
    }
  }
  onSelect: (topicName: string) => void
}

interface SubtopicItemProps { 
  name: string
  status: 'not-started' | 'in-progress' | 'complete'
  progress?: number
  onClick: () => void
}

function SubtopicItem({ 
  name, 
  status, 
  progress,
  onClick 
}: SubtopicItemProps) {
  return (
    <Button
      variant="ghost"
      className="ml-8 mb-4 last:mb-0 w-full justify-start p-2 h-auto hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 w-full">
        {status === 'complete' ? (
          <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
        ) : status === 'in-progress' ? (
          <CircleDot className="h-4 w-4 text-primary flex-shrink-0" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className={cn(
          "text-sm text-left",
          status === 'complete' ? "text-primary" :
          status === 'in-progress' ? "text-foreground" :
          "text-muted-foreground"
        )}>
          {name}
        </span>
      </div>
      {status === 'in-progress' && typeof progress === 'number' && (
        <div className="ml-7 mt-2 w-full">
          <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </Button>
  )
}

export function TopicProgress({ topic, isActive, progress, onSelect }: TopicProgressProps) {
  const [isExpanded, setIsExpanded] = useState(isActive)
  
  const topicStatus = progress[topic.name]?.status || 'not-started'
  const topicProgress = progress[topic.name]?.progress || 0

  const handleClick = () => {
    setIsExpanded(!isExpanded)
    onSelect(topic.name)
  }

  const handleSubtopicClick = (subtopicName: string) => {
    onSelect(subtopicName)
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <Button
        variant="ghost"
        className="w-full justify-between p-4 h-auto hover:bg-muted/50"
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          {topicStatus === 'complete' ? (
            <CheckCircle2 className="h-5 w-5 text-primary" />
          ) : topicStatus === 'in-progress' ? (
            <CircleDot className="h-5 w-5 text-primary" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground" />
          )}
          <span className={cn(
            "font-medium",
            topicStatus === 'complete' ? "text-primary" :
            topicStatus === 'in-progress' ? "text-foreground" :
            "text-muted-foreground"
          )}>
            {topic.name}
          </span>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
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
            <div className="px-4 pb-4">
              {topic.subtopics.map((subtopic, index) => (
                <SubtopicItem
                  key={index}
                  name={subtopic.name}
                  status={progress[subtopic.name]?.status || 'not-started'}
                  progress={progress[subtopic.name]?.progress}
                  onClick={() => handleSubtopicClick(subtopic.name)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
} 