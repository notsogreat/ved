'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2, Play, RotateCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VerticalProgressSteps } from '@/components/learning/vertical-progress-steps'
import ProblemDisplay from '@/components/learning/problem-display'
import { toast } from "sonner"
import { AllTopics } from "@/config/topics"
import { useRouter } from 'next/navigation'

interface Question {
  title: string;
  description: string;
  examples: Array<{
    input: string;
    output: string;
    explanation: string;
  }>;
  constraints: string[];
  testCases: Array<{
    input: string;
    output: string;
  }>;
}

// First, add this mapping
const categoryMapping = {
  'data-structures': 'Data Structures',
  'algorithms': 'Algorithms',
  'system-design': 'System Design',
  'web-development': 'Web Development'
} as const

export default function CodeEditorPage() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category') || 'data-structures'
  // Map the URL parameter to the actual category name
  const category = categoryMapping[urlCategory as keyof typeof categoryMapping] as keyof typeof AllTopics
  const topicName = searchParams.get('topic') || "Arrays & Strings"
  
  const [code, setCode] = useState(`package main\n\nimport "fmt"\n\nfunc main() {\n    // Your Go code here\n}`)
  const [output, setOutput] = useState('')
  const [isProgressBarOpen, setIsProgressBarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string>('')
  const router = useRouter()

  // Fetch question when component mounts
  useEffect(() => {
    fetchQuestion()
  }, [urlCategory, topicName])

  const fetchQuestion = async () => {
    setIsLoading(true)
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        router.push('/auth/login?redirect=/learn/code-editor')
        return
      }

      const response = await fetch(`/api/questions/${urlCategory}?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch question')
      }

      const { status, data } = await response.json()
      if (status === 'success' && data) {
        setCurrentQuestion({
          title: data.title,
          description: data.description,
          examples: data.examples || [],
          constraints: data.constraints || [],
          testCases: data.testCases || []
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching question:', error)
      toast.error('Failed to fetch question')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setCode(`package main\n\nimport "fmt"\n\nfunc main() {\n    // Your Go code here\n}`)
    setOutput('')
    setError('')
  }

  const executeCode = async (code: string) => {
    setIsExecuting(true)
    setOutput('')
    setError('')

    try {
      const response = await fetch('/api/code-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (result.error) {
        const errorMessage = result.error.replace('# command-line-arguments\n', '')
          .split('\n')
          .filter(Boolean)
          .map((line: string) => {
            if (line.includes('/tmp/main.go:')) {
              const match = line.match(/\/tmp\/main\.go:(\d+):(\d+):\s(.+)/)
              if (match) {
                const [, lineNum, colNum, msg] = match
                return `Line ${lineNum}, Column ${colNum}: ${msg}`
              }
            }
            return line
          })
          .join('\n')

        setError(errorMessage)
      } else {
        setOutput(result.output)
      }
    } catch (err) {
      console.error('Code execution error:', err)
      setError('Failed to execute code')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Progress Bar - Collapsible Sidebar */}
      <motion.div 
        initial={false}
        animate={{ width: isProgressBarOpen ? '16rem' : '3rem' }}
        className="relative h-full border-r bg-card"
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-4 z-10"
          onClick={() => setIsProgressBarOpen(!isProgressBarOpen)}
        >
          {isProgressBarOpen ? <ChevronLeft /> : <ChevronRight />}
        </Button>
        <div className={cn("h-full overflow-y-auto", !isProgressBarOpen && "hidden")}>
          <VerticalProgressSteps 
            topics={AllTopics[category]}
            activeTopic={topicName}
            onTopicSelect={(topic) => {
              console.log('Topic selected:', topic)
            }}
          />
        </div>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-2 h-full overflow-hidden">
        {/* Problem Description Panel */}
        <div className="h-full overflow-y-auto border-r">
          <Card className="border-0 rounded-none h-full">
            <Tabs defaultValue="problem" className="h-full">
              <TabsList className="w-full rounded-none border-b bg-muted">
                <TabsTrigger value="problem" className="flex-1">Problem</TabsTrigger>
                <TabsTrigger value="hints" className="flex-1">Hints</TabsTrigger>
                <TabsTrigger value="solutions" className="flex-1">Solutions</TabsTrigger>
              </TabsList>

              <TabsContent value="problem" className="p-6 h-[calc(100%-3rem)] overflow-y-auto">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="prose dark:prose-invert max-w-none">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-primary m-0">
                        {currentQuestion?.title || "Loading..."}
                      </h2>
                    </div>
                    
                    <p className="text-foreground">
                      {currentQuestion?.description}
                    </p>
                    
                    {currentQuestion?.examples?.map((example, index) => (
                      <div key={index} className="mt-6 bg-muted rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-primary">Example {index + 1}:</h3>
                        <pre className="mt-2 p-3 bg-card rounded-md font-mono text-sm text-foreground border">
                          {`Input: ${example.input}\nOutput: ${example.output}${example.explanation ? `\nExplanation: ${example.explanation}` : ''}`}
                        </pre>
                      </div>
                    ))}

                    {currentQuestion?.constraints && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-primary">Constraints:</h3>
                        <ul className="list-disc list-inside text-muted-foreground text-sm space-y-2 ml-2">
                          {currentQuestion.constraints.map((constraint, index) => (
                            <li key={index}>{constraint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="hints" className="p-4">
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg p-4 border">
                    <h3 className="text-sm font-medium text-primary">Hint 1</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Consider using two pointers approach - one at the start and one at the end.
                    </p>
                  </div>
                  <div className="bg-muted rounded-lg p-4 border">
                    <h3 className="text-sm font-medium text-primary">Hint 2</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Think about swapping elements until the pointers meet.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Code Editor Panel */}
        <div className="h-full flex flex-col">
          <div className="border-b p-4 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">main.go</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleReset}
                  disabled={isExecuting}
                >
                  <RotateCw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={() => executeCode(code)}
                  disabled={isExecuting}
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" />
                      Run Code
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100%"
              defaultLanguage="go"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>

          <div className="h-48 border-t bg-card">
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {error ? 'Compilation Error' : 'Output'}
              </h3>
              <div className={cn(
                "h-28 overflow-auto p-4 rounded-lg font-mono text-sm",
                error 
                  ? "bg-destructive/10 text-destructive" 
                  : "bg-muted text-foreground"
              )}>
                {error ? (
                  <pre className="whitespace-pre-wrap">{error}</pre>
                ) : output ? (
                  <pre className="whitespace-pre-wrap">{output}</pre>
                ) : (
                  <span className="text-muted-foreground">Output will appear here...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 