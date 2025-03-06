'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PaperClipIcon, ArrowUpIcon } from "@heroicons/react/24/outline"
import { PlayIcon, ArrowPathIcon, CheckCircleIcon } from "@heroicons/react/24/solid"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import Editor from '@monaco-editor/react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp, GripHorizontal } from "lucide-react"

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Language {
  id: string
  name: string
  extension: string
  defaultCode: string
}

interface TerminalEntry {
  type: 'command' | 'output' | 'error'
  content: string
  timestamp: Date
}

interface EvaluationResult {
  evaluation: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    defaultCode: '// Your JavaScript code here\n\n',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    extension: 'ts',
    defaultCode: '// Your TypeScript code here\n\n',
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    defaultCode: '# Your Python code here\n\n',
  },
  {
    id: 'go',
    name: 'Go',
    extension: 'go',
    defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Your Go code here\n}\n',
  },
]

interface MarkdownComponentProps {
  children?: ReactNode
  [key: string]: any
}

const MarkdownMessage = ({ content }: { content: string }) => {
  const components = {
    h1: ({ children, ...props }: MarkdownComponentProps) => (
      <h1 className="text-2xl font-bold mb-4 mt-6" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: MarkdownComponentProps) => (
      <h2 className="text-xl font-bold mb-3 mt-5" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: MarkdownComponentProps) => (
      <h3 className="text-lg font-bold mb-2 mt-4" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }: MarkdownComponentProps) => (
      <h4 className="text-base font-bold mb-2 mt-3" {...props}>{children}</h4>
    ),
    p: ({ children, ...props }: MarkdownComponentProps) => (
      <p className="mb-4" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }: MarkdownComponentProps) => (
      <ul className="list-disc list-inside mb-4" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }: MarkdownComponentProps) => (
      <ol className="list-decimal list-inside mb-4" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }: MarkdownComponentProps) => (
      <li className="mb-1" {...props}>{children}</li>
    ),
    code: ({ inline, className, children, ...props }: MarkdownComponentProps & { inline?: boolean, className?: string }) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          language={match[1]}
          style={vscDarkPlus}
          PreTag="div"
          className="rounded-md mb-4"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-zinc-800 rounded px-1.5 py-0.5 text-sm" {...props}>
          {children}
        </code>
      )
    },
    blockquote: ({ children, ...props }: MarkdownComponentProps) => (
      <blockquote className="border-l-4 border-zinc-700 pl-4 mb-4 italic" {...props}>
        {children}
      </blockquote>
    ),
    a: ({ children, ...props }: MarkdownComponentProps) => (
      <a className="text-blue-400 hover:text-blue-300 underline" {...props}>
        {children}
      </a>
    ),
    table: ({ children, ...props }: MarkdownComponentProps) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-zinc-800" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: MarkdownComponentProps) => (
      <th className="px-4 py-2 bg-zinc-800 font-medium" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: MarkdownComponentProps) => (
      <td className="px-4 py-2 border-t border-zinc-800" {...props}>
        {children}
      </td>
    ),
  }

  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  )
}

export default function ChatSessionPage({
  params,
}: {
  params: { chatId: string }
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading } = useAuth()
  const [inputValue, setInputValue] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0])
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].defaultCode)
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialQueryProcessed = useRef(false)
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluationResult, setEvaluationResult] = useState<string>("")
  const [currentProblem, setCurrentProblem] = useState<string>("")
  const [terminalHeight, setTerminalHeight] = useState(30) // Default 30vh
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/chat')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Handle initial query
    const initialQuery = searchParams.get('q')
    if (initialQuery && !initialQueryProcessed.current && !isLoading && user) {
      initialQueryProcessed.current = true
      handleInitialMessage(initialQuery)
    }
  }, [searchParams, isLoading, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // Auto scroll terminal to bottom when new entries are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  const handleInitialMessage = async (message: string) => {
    setMessages([{ role: 'user', content: message }])
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          conversationHistory: [] // Start with empty history for initial message
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      toast.error('Failed to get response')
      console.error('Chat error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async () => {
    if (!inputValue.trim() || isSubmitting) return

    const userMessage = inputValue.trim()
    setInputValue("")
    setIsSubmitting(true)

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory: messages // Send all previous messages as history
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      // Add AI response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    } catch (error) {
      toast.error('Failed to get response')
      console.error('Chat error:', error)
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

  const handleLanguageChange = (languageId: string) => {
    const newLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === languageId)
    if (newLanguage) {
      setSelectedLanguage(newLanguage)
      setCode(newLanguage.defaultCode)
    }
  }

  const executeCode = async () => {
    if (!code.trim() || isExecuting) return

    setIsExecuting(true)
    setOutput("")
    setError("")

    // Add command to terminal history
    setTerminalHistory(prev => [...prev, {
      type: 'command',
      content: `[${selectedLanguage.name}] Executing code...`,
      timestamp: new Date()
    }])

    try {
      const response = await fetch('/api/code-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          language: selectedLanguage.id
        }),
      })

      const result = await response.json()

      if (result.error) {
        setError(result.error)
        setTerminalHistory(prev => [...prev, {
          type: 'error',
          content: result.error,
          timestamp: new Date()
        }])
      } else {
        setOutput(result.output)
        setTerminalHistory(prev => [...prev, {
          type: 'output',
          content: result.output || 'Program completed with no output',
          timestamp: new Date()
        }])
      }
    } catch (err) {
      console.error('Code execution error:', err)
      const errorMessage = 'Failed to execute code'
      setError(errorMessage)
      setTerminalHistory(prev => [...prev, {
        type: 'error',
        content: errorMessage,
        timestamp: new Date()
      }])
    } finally {
      setIsExecuting(false)
    }
  }

  const handleEvaluate = async () => {
    if (!code.trim() || isEvaluating) return
    setIsEvaluating(true)
    setEvaluationResult("")

    try {
      const response = await fetch('/api/code-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          problem: currentProblem,
          targetJobTitle: "Software Engineer" // This should come from user profile or context
        }),
      })

      if (!response.ok) throw new Error('Failed to evaluate code')

      const result: EvaluationResult = await response.json()
      setEvaluationResult(result.evaluation)
      
      // Add evaluation result to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.evaluation
      }])

      // Scroll to the evaluation result
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (error) {
      toast.error('Failed to evaluate code')
      console.error('Evaluation error:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  // Update currentProblem when receiving a new problem from the AI
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content.includes('Problem Title:')) {
      setCurrentProblem(lastMessage.content)
    }
  }, [messages])

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = terminalHeight
    
    // Add temporary event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const delta = dragStartY.current - e.clientY
      const newHeight = Math.min(Math.max(dragStartHeight.current + (delta / window.innerHeight) * 100, 10), 90)
      setTerminalHeight(newHeight)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
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
    <div className="fixed inset-0 flex bg-black">
      {/* Left side - Chat */}
      <div className="w-1/2 border-r border-zinc-800 flex flex-col h-screen">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-white'
                }`}
              >
                {message.role === 'assistant' ? (
                  <MarkdownMessage content={message.content} />
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="p-4 border-t border-zinc-800">
          <div className="relative">
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
      </div>

      {/* Right side - Code Editor */}
      <div className="w-1/2 flex flex-col h-screen">
        {/* Header with language selector and buttons */}
        <div className="border-b border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-zinc-400">Language:</span>
              <Select
                value={selectedLanguage.id}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-[140px] h-8 bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {SUPPORTED_LANGUAGES.map((language) => (
                    <SelectItem
                      key={language.id}
                      value={language.id}
                      className="text-white hover:bg-zinc-800"
                    >
                      {language.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={executeCode}
                disabled={isExecuting || !code.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isExecuting ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Run Code
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleEvaluate}
                disabled={isEvaluating || !code.trim() || !currentProblem}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isEvaluating ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Evaluate
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Code Editor - adjust height based on terminal state */}
        <div className={`flex-grow ${isTerminalMinimized ? 'h-[calc(100vh-80px)]' : `h-[calc(${100-terminalHeight}vh-80px)]`}`}>
          <Editor
            height="100%"
            defaultLanguage={selectedLanguage.id}
            language={selectedLanguage.id}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Resizable Terminal */}
        <div 
          className={`relative transition-all duration-300 ease-in-out ${
            isTerminalMinimized ? 'h-10' : `h-[${terminalHeight}vh]`
          } border-t border-zinc-800 bg-[#1E1E1E] overflow-hidden`}
        >
          {/* Drag Handle */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 cursor-ns-resize flex items-center justify-center hover:bg-zinc-700 ${
              isDragging ? 'bg-zinc-700' : ''
            }`}
            onMouseDown={handleDragStart}
          >
            <GripHorizontal className="h-4 w-4 text-zinc-600" />
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400">Terminal</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-zinc-400 hover:text-white"
                onClick={() => setTerminalHistory([])}
              >
                Clear
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-zinc-400 hover:text-white"
                onClick={() => setIsTerminalMinimized(!isTerminalMinimized)}
              >
                {isTerminalMinimized ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {!isTerminalMinimized && (
            <div 
              ref={terminalRef}
              className="h-[calc(100%-36px)] overflow-auto p-4 font-mono text-sm"
            >
              {terminalHistory.length === 0 ? (
                <div className="text-zinc-600 italic">
                  Terminal ready. Run your code to see the output here.
                </div>
              ) : (
                <div className="space-y-2">
                  {terminalHistory.map((entry, index) => (
                    <div key={index} className="font-mono">
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-500 select-none">
                          {entry.timestamp.toLocaleTimeString()} $
                        </span>
                        <span 
                          className={
                            entry.type === 'command' 
                              ? 'text-blue-400'
                              : entry.type === 'error'
                              ? 'text-red-400'
                              : 'text-green-400'
                          }
                        >
                          {entry.content}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 