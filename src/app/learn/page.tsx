"use client"

import { TopicCard } from "@/components/learning/topic-card"
import { useRouter } from "next/navigation"
import { topics } from "@/config/topics"

export default function LearnPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Choose Your Learning Path
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a topic to begin your journey. Each path is carefully crafted to take you from basics to advanced concepts.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic, index) => (
            <TopicCard
              key={topic.id}
              title={topic.title}
              description={topic.description}
              topicId={topic.id}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

