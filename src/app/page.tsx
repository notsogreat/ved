'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion, useAnimationControls } from "framer-motion"
import { 
  Search, 
  Target, 
  Brain, 
  CheckCircle, 
  Sparkles,
  Building2,
  GraduationCap,
  Circle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { Header } from "@/components/layout/header"

export default function HomePage() {
  const router = useRouter()
  const controls = useAnimationControls()

  useEffect(() => {
    const animate = async () => {
      await controls.start({
        opacity: 1,
        transition: { duration: 0.5 }
      })
      await controls.start("visible")
    }
    animate()
  }, [controls])

  const text1 = "Master Your Tech".split("").map((char, index) => {
    return char === " " ? "\u00A0" : char
  })

  const text2 = "Interviews"

  const textVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const letterVariants = {
    hidden: { 
      opacity: 0,
      y: 20 
    },
    visible: { 
      opacity: 1,
      y: 0
    }
  }

  const features = [
    {
      icon: <Building2 className="h-8 w-8 text-primary" />,
      title: "Company-Specific Questions",
      description: "We analyze online interview data from your target company to create tailored questions that match real interviews"
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Job-Focused Preparation",
      description: "Get customized questions based on your specific job title and description for targeted interview preparation"
    },
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "Adaptive Learning Path",
      description: "No more random leetcode grinding. Get questions matched to your skill level for structured interview preparation"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "Interview Readiness Score",
      description: "Our AI assesses your preparation and tells you when you're ready to confidently tackle the interview"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "AI Interview Evolution",
      description: "Stay ahead with preparation that adapts to how AI is transforming the interview landscape"
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSignIn={true} showSignUp={true} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 mt-14">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center max-w-5xl mx-auto text-center"
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50"
            initial="hidden"
            animate={controls}
            variants={textVariants}
          >
            <motion.span className="inline-block">
              {text1.map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  variants={letterVariants}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
            <br />
            <motion.span className="inline-block">
              {text2.split("").map((char, index) => (
                <motion.span
                  key={index}
                  className="inline-block"
                  variants={letterVariants}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl mb-8 text-center text-muted-foreground max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Elevate your interview preparation with our AI-powered platform. 
            Get personalized questions, real-time feedback, and track your progress 
            to land your dream tech role.
          </motion.p>

          <motion.div
            className="flex gap-4 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button 
              size="lg"
              onClick={() => router.push('/auth/signup')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              Start Practice
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors h-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 + (index * 0.1) }}
              >
                <div className="rounded-full p-2 bg-primary/10 mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-semibold mb-2 text-center">{feature.title}</h3>
                <p className="text-xs text-muted-foreground text-center">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="container flex h-14 items-center justify-between text-sm">
          <p className="text-muted-foreground">
            © 2024 Round0. All rights reserved.
          </p>
          <nav className="flex items-center space-x-4 text-muted-foreground">
            <Button variant="link" size="sm">Terms</Button>
            <Button variant="link" size="sm">Privacy</Button>
            <Button variant="link" size="sm">Contact</Button>
          </nav>
        </div>
      </footer>
    </div>
  )
}