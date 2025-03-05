'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PaperClipIcon, ArrowUpIcon } from "@heroicons/react/24/outline"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

const suggestions = [
  { id: 1, text: "Data Structures", icon: "📊" },
  { id: 2, text: "Algorithms", icon: "🔄" },
  { id: 3, text: "System Design", icon: "🏗️" },
  { id: 4, text: "Interview Preparation", icon: "📝" },
]

export default function ChatPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/chat')
    }
  }, [user, isLoading, router])

  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return
    setIsSubmitting(true)

    try {
      // Generate a unique chat ID
      const chatId = uuidv4()
      
      // Create initial message in the database or state management
      // ... (you can add this later)

      // Redirect to the chat session
      router.push(`/chat/${chatId}?q=${encodeURIComponent(inputValue.trim())}`)
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
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-3xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            What can I help you learn?
          </h1>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion.id}
                variant="outline"
                className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700"
                onClick={() => {
                  setInputValue(suggestion.text)
                  setTimeout(() => handleSubmit(), 100)
                }}
              >
                <span className="mr-2">{suggestion.icon}</span>
                {suggestion.text}
              </Button>
            ))}
          </div>

          <div className="relative mt-4">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask me about helping you crack some interviews..."
              className="w-full pl-4 pr-24 py-6 bg-zinc-900 border-zinc-800 text-white rounded-xl shadow-lg focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                disabled={isSubmitting}
              >
                <PaperClipIcon className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                onClick={handleSubmit}
                disabled={isSubmitting || !inputValue.trim()}
              >
                <ArrowUpIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 