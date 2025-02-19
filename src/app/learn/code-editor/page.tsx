'use client'

import { useState } from 'react'
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

const dataStructureSteps = [
  { title: 'Arrays Basics', status: 'complete' as const },
  { title: 'Array Operations', status: 'complete' as const },
  { title: 'Linked Lists', status: 'in-progress' as const },
  { title: 'Trees', status: 'not-started' as const },
  { title: 'Graphs', status: 'not-started' as const },
]

export default function CodeEditorPage() {
  const [code, setCode] = useState(`package main

import "fmt"

func main() {
    // Your Go code here
}`)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentStep] = useState(2)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isProgressBarOpen, setIsProgressBarOpen] = useState(true)

  const handleRunCode = async () => {
    setIsRunning(true)
    setIsError(false)
    setOutput('')

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code,
          language_id: 60 // 60 is Go language ID in Judge0
        }),
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Execution failed')
      
      if (data.error) {
        setIsError(true)
        setOutput(data.error)
      } else {
        setOutput(data.output)
      }
    } catch (error) {
      setIsError(true)
      setOutput(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setCode(`package main

import "fmt"

func main() {
    // Your Go code here
}`)
    setOutput('')
    setIsError(false)
  }

  const handleGenerateQuestion = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          topic: 'algorithms',
          difficulty: 'medium'
        }),
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to generate question')
      
      setCurrentQuestion(data)
      toast.success("New question generated!")
    } catch (error) {
      console.error('Error generating question:', error)
      toast.error("Failed to generate question")
    } finally {
      setIsGenerating(false)
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
            steps={dataStructureSteps}
            currentStep={currentStep}
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
                <div className="prose dark:prose-invert max-w-none">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-primary m-0">
                      {currentQuestion?.title || "Array Reversal"}
                    </h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateQuestion}
                      disabled={isGenerating}
                      className="flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {isGenerating ? "Generating..." : "Generate New Question"}
                    </Button>
                  </div>
                  
                  <p className="text-foreground">
                    {currentQuestion?.description || 
                      "Write a Go program that reverses an array of integers without using any built-in reverse functions."}
                  </p>
                  
                  {(currentQuestion?.examples || [{
                    input: "[1, 2, 3, 4, 5]",
                    output: "[5, 4, 3, 2, 1]",
                    explanation: ""
                  }]).map((example, index) => (
                    <div key={index} className="mt-6 bg-muted rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-primary">Example {index + 1}:</h3>
                      <pre className="mt-2 p-3 bg-card rounded-md font-mono text-sm text-foreground border">
{`Input: ${example.input}
Output: ${example.output}${example.explanation ? `\nExplanation: ${example.explanation}` : ''}`}</pre>
                    </div>
                  ))}

                  <div className="mt-6 space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Constraints:</h3>
                    <ul className="list-disc list-inside text-muted-foreground text-sm space-y-2 ml-2">
                      {currentQuestion?.constraints?.map((constraint, index) => (
                        <li key={index}>{constraint}</li>
                      )) || (
                        <>
                          <li>1 ≤ array length ≤ 10⁵</li>
                          <li>-10⁹ ≤ elements ≤ 10⁹</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
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
                  disabled={isRunning}
                >
                  <RotateCw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleRunCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
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
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Output</h3>
              <div className={cn(
                "h-28 overflow-auto p-4 rounded-lg bg-muted font-mono text-sm",
                isError ? "bg-destructive/10 text-destructive" : "text-foreground"
              )}>
                {output ? (
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