'use client'

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface TopicCardProps {
  title: string
  description: string
  topicId: string
  index: number
}

export function TopicCard({ title, description, topicId, index }: TopicCardProps) {
  const router = useRouter()

  const handleStartLearning = () => {
    router.push(`/learn/code-editor?category=${topicId}&topic=${encodeURIComponent(title)}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="p-6 space-y-4 h-full flex flex-col">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {title}
          </h3>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>
        <Button 
          onClick={handleStartLearning}
          className="w-full"
        >
          Start Learning
        </Button>
      </Card>
    </motion.div>
  )
} 