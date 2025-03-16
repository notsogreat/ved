'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { SpaceBackground } from "@/components/ui/space-background"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center bg-background text-foreground p-4 overflow-hidden">
      <SpaceBackground />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex flex-col items-center max-w-3xl mx-auto text-center"
      >
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-6 text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Welcome to Vedh AI
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl mb-8 text-center text-muted-foreground max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Prepare for your next interview with AI-powered adaptive learning platform. Experience personalized questions, real-time
          code analysis, and track your progress.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            size="lg"
            onClick={() => router.push('/auth/login?redirect=/chat')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            Let's Go
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}