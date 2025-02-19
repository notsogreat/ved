'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

interface ProgressCardProps {
  completedLessons: number
  totalLessons: number
}

export function ProgressCard({ completedLessons, totalLessons }: ProgressCardProps) {
  const progress = (completedLessons / totalLessons) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="w-full"
    >
      <Card className="mt-12 bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Your Learning Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full bg-gray-800 rounded-full h-2.5">
            <motion.div 
              className="bg-purple-600 h-2.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, delay: 0.8 }}
            />
          </div>
          <motion.div 
            className="flex justify-between items-center text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
          >
            <span>{Math.round(progress)}% Complete</span>
            <span>{completedLessons}/{totalLessons} Lessons</span>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
} 