'use client'

import { useState } from 'react'
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PaperClipIcon, ArrowUpIcon } from "@heroicons/react/24/outline"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { Circle } from 'lucide-react'

const suggestions = [
  { 
    id: 1, 
    title: "Can you help me with",
    subtitle: "Google interview preparation?",
  },
  { 
    id: 2, 
    title: "Help me prepare for",
    subtitle: "Software Engineering role",
  },
  { 
    id: 3, 
    title: "Can you help me with",
    subtitle: "Data Structures for Facebook?",
  },
  { 
    id: 4, 
    title: "Help me practice",
    subtitle: "System Design questions",
  }
]

export default function ChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: inputValue.trim(),
          sessionId: null,
          conversationHistory: []
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create chat session')
      }

      const data = await response.json()
      router.push(`/chat/${data.sessionId}`)
    } catch (error) {
      toast.error('Failed to start chat')
      console.error('Chat error:', error)
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="relative flex min-h-svh flex-1 flex-col bg-background">
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* Sticky Header */}
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
          <Header showSignOut={true} onSignOut={() => router.push('/auth/login')} />
        </header>

        {/* Scrollable Content Area */}
        <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4">
          <div className="max-w-3xl mx-auto md:mt-20">
            <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
              <div className="flex flex-row justify-center gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Circle className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-bold">Round0 AI Assistant</h1>
              <p className="text-muted-foreground">
                This is an AI-powered interview preparation assistant. It helps you practice coding problems,
                system design, and behavioral questions tailored to your target companies.
              </p>
            </div>
          </div>
          <div className="shrink-0 min-w-[24px] min-h-[24px]"></div>
        </div>

        {/* Fixed Chat Form at Bottom */}
        <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl" onSubmit={(e) => e.preventDefault()}>
          <div className="relative w-full flex flex-col gap-4">
            {/* Suggestions Grid */}
            <div className="grid sm:grid-cols-2 gap-2 w-full">
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="block"
                >
                  <button
                    className="inline-flex whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                    onClick={() => {
                      setInputValue(`${suggestion.title} ${suggestion.subtitle}`)
                      setTimeout(() => handleSubmit(), 100)
                    }}
                  >
                    <span className="font-medium">{suggestion.title}</span>
                    <span className="text-muted-foreground">{suggestion.subtitle}</span>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Send a message..."
                rows={2}
                className="flex w-full border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700"
                style={{ height: '98px' }}
                disabled={isSubmitting}
              />
              
              {/* Send Button */}
              <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                <Button
                  size="icon"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border dark:border-zinc-600"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !inputValue.trim()}
                >
                  <ArrowUpIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
} 