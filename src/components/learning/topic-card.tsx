'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface TopicCardProps {
  title: string
  description: string
  onStart: () => void
  index: number
}

export function TopicCard({ title, description, onStart, index }: TopicCardProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onStart()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      onClick={handleClick}
      className="cursor-pointer"
    >
      <Card className="group relative overflow-hidden border bg-card transition-colors hover:border-primary/50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </div>
            </motion.div>
          </div>
          
          <p className="mt-3 text-muted-foreground">
            {description}
          </p>
          
          <div className="mt-6">
            <Button 
              onClick={handleClick}
              className="w-full transition-all hover:bg-primary/90"
            >
              Start Learning
            </Button>
          </div>
        </div>

        {/* Gradient border effect */}
        <div className="absolute inset-0 border border-transparent group-hover:border-primary/20 rounded-lg transition-colors" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="absolute inset-y-0 -left-px w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
          <div className="absolute inset-y-0 -right-px w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />
        </div>
      </Card>
    </motion.div>
  )
} 