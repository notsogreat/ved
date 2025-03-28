'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PaperClipIcon, ArrowUpIcon } from "@heroicons/react/24/outline"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { Circle, User } from 'lucide-react'

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

// Define message storage keys
const MESSAGE_STORAGE_PREFIX = 'chat_messages_'

// Define props interface
interface StreamChatPageProps {
  initialConversationId?: string
}

export default function StreamChatPage({ initialConversationId }: StreamChatPageProps = {}) {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const streamAbortController = useRef<AbortController | null>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const isInitialRender = useRef(true)
  const isRouteChanging = useRef(false)

  // Load stored messages on initial render - only once
  useEffect(() => {
    if (conversationId) {
      const storedMessages = localStorage.getItem(`${MESSAGE_STORAGE_PREFIX}${conversationId}`)
      if (storedMessages) {
        try {
          setMessages(JSON.parse(storedMessages))
        } catch (error) {
          console.error("Error parsing stored messages:", error)
        }
      }
    }
  }, [conversationId])

  // Save messages to localStorage when they change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      localStorage.setItem(`${MESSAGE_STORAGE_PREFIX}${conversationId}`, JSON.stringify(messages))
    }
  }, [messages, conversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentStreamingMessage])

  // Cleanup abort controller if component unmounts
  useEffect(() => {
    return () => {
      if (streamAbortController.current) {
        streamAbortController.current.abort()
      }
    }
  }, [])

  // Handle params changes
  useEffect(() => {
    // Don't do anything on initial render if we have a conversationId from props
    if (isInitialRender.current && initialConversationId) {
      isInitialRender.current = false
      return
    }
    
    // Don't update the ID if we're in the middle of a route change
    if (isRouteChanging.current) {
      return
    }
    
    // Extract and validate conversation ID from params
    const extractConversationId = async () => {
      try {
        if (params) {
          const id = typeof params.id === 'string' ? params.id : 
                    Array.isArray(params.id) ? params.id[0] : null
          
          if (id && id !== conversationId) {
            setConversationId(id)
          }
        }
      } catch (error) {
        console.error("Error accessing params:", error)
      }
    }
    
    extractConversationId()
  }, [params, initialConversationId, conversationId])

  // Process a streaming response
  const processStreamingResponse = useCallback(async (responseBody: ReadableStream<Uint8Array>) => {
    const reader = responseBody.getReader()
    const decoder = new TextDecoder()
    let streamedMessage = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        
        const lines = chunk.split('\n')
        let messageChunk = ""
        
        for (const line of lines) {
          if (line.trim() === '') continue
          
          try {
            const data = JSON.parse(line)
            const content = data.choices?.[0]?.delta?.content || ''
            if (content) {
              messageChunk += content
            }
          } catch (e) {
            console.warn('Error parsing line:', line)
          }
        }
        
        if (messageChunk) {
          streamedMessage += messageChunk
          setCurrentStreamingMessage(prev => prev + messageChunk)
        }
      }

      // Add the complete message to messages array
      if (streamedMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: streamedMessage }])
        setCurrentStreamingMessage("")
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error processing stream:', error)
        throw error
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return
    setIsSubmitting(true)

    const userMessage = inputValue.trim()
    setInputValue("")
    setCurrentStreamingMessage("")

    // Add user message to chat immediately
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }]
    setMessages(updatedMessages)

    try {
      // Create a new conversation ID if needed
      let currentId = conversationId
      if (!currentId) {
        currentId = uuidv4()
        setConversationId(currentId)
        
        // Mark that we're changing routes to avoid param effects
        isRouteChanging.current = true
        
        // Update URL without triggering navigation
        window.history.replaceState({}, '', `/chat/stream/${currentId}`)
        
        // Give a small delay to ensure URL change is registered
        await new Promise(resolve => setTimeout(resolve, 20))
        isRouteChanging.current = false
      }
      
      // Cancel previous streaming request if it exists
      if (streamAbortController.current) {
        streamAbortController.current.abort()
      }
      
      // Create a new abort controller for this request
      streamAbortController.current = new AbortController()

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory: updatedMessages,
          conversationId: currentId
        }),
        signal: streamAbortController.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Process the streaming response
      await processStreamingResponse(response.body)

    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error('Failed to get response')
        console.error('Chat error:', error)
      }
    } finally {
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

  const hasMessages = messages.length > 0

  return (
    <main className="relative flex min-h-svh flex-1 flex-col bg-background">
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* Sticky Header */}
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
          <Header showSignOut={true} onSignOut={() => router.push('/auth/login')} />
        </header>

        {/* Scrollable Content Area */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {!hasMessages && (
            <div className="flex justify-center items-center flex-col w-full flex-1">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Circle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Round0 AI Assistant</h1>
              <p className="text-muted-foreground max-w-md text-center px-4">
                This is an AI-powered interview preparation assistant. It helps you practice coding problems,
                system design, and behavioral questions tailored to your target companies.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="max-w-4xl w-full mx-auto">
            {messages.map((message, index) => (
              <div key={index} className={cn("mb-6", index === 0 && "mt-4")}>
                <div className={cn(
                  "flex items-start gap-3 px-4",
                )}>
                  {message.role === 'assistant' ? (
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Circle className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="font-medium text-sm">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-li:marker:text-primary">
                      {message.content.split('\n').map((paragraph, i) => (
                        <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {currentStreamingMessage && (
              <div className="mb-6">
                <div className="flex items-start gap-3 px-4">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Circle className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="font-medium text-sm">
                      AI Assistant
                    </div>
                    <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-li:marker:text-primary">
                      {currentStreamingMessage.split('\n').map((paragraph, i) => (
                        <p key={i} className="whitespace-pre-wrap">{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Invisible element to scroll to */}
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Fixed Chat Form at Bottom */}
        <div>
          <form className="flex mx-auto px-4 bg-background py-3 md:py-4 gap-2 w-full max-w-4xl" onSubmit={(e) => e.preventDefault()}>
            <div className="relative w-full flex flex-col gap-4">
              {/* Suggestions Grid */}
              {!hasMessages && (
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
              )}

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
      </div>
    </main>
  )
} 