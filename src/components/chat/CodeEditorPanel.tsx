'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { PlayIcon, ArrowPathIcon, CheckCircleIcon, BookmarkIcon } from "@heroicons/react/24/solid"
import { X } from 'lucide-react'
import { toast } from 'sonner'
import Editor from '@monaco-editor/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp, GripHorizontal } from "lucide-react"

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

interface CodeEditorPanelProps {
  chatId: string
  currentProblem?: string
  onEvaluationComplete?: (evaluation: string) => void
  onClose: () => void
}

const languages: Language[] = [
  {
    id: 'go',
    name: 'Go',
    extension: 'go',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go Lambda!")
}`,
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    defaultCode: `# Simple Python test
print("Hello from Python Lambda!")`,
  }
]

export function CodeEditorPanel({ chatId, currentProblem, onEvaluationComplete, onClose }: CodeEditorPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0])
  const [code, setCode] = useState(languages[0].defaultCode)
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([])
  const terminalRef = useRef<HTMLDivElement>(null)
  const [terminalHeight, setTerminalHeight] = useState(200)
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const minTerminalHeight = 100
  const maxTerminalHeight = 500

  // Load saved code on mount
  useEffect(() => {
    const loadSavedCode = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}/code?language=${selectedLanguage.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch saved code')
        }

        const { codeSubmission } = await response.json()
        
        if (codeSubmission && codeSubmission.language === selectedLanguage.id) {
          setCode(codeSubmission.code)
          toast.success('Loaded saved code')
        } else {
          // If no saved code exists, use the default code for the current language
          setCode(selectedLanguage.defaultCode)
        }
      } catch (error) {
        console.error('Error loading saved code:', error)
        // If there's an error, use the default code for the current language
        setCode(selectedLanguage.defaultCode)
      }
    }

    loadSavedCode()
  }, [chatId, selectedLanguage.id])

  useEffect(() => {
    // Auto scroll terminal to bottom when new entries are added
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalHistory])

  const handleLanguageChange = (languageId: string) => {
    const newLanguage = languages.find(lang => lang.id === languageId)
    if (newLanguage) {
      setSelectedLanguage(newLanguage)
      // The useEffect will handle loading the code for the new language
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
    if (!code.trim() || isEvaluating || !currentProblem) return
    setIsEvaluating(true)

    try {
      // First save the code to get a codeSubmissionId
      let codeSubmissionId: string | undefined;
      
      if (!isSaving) {
        setIsSaving(true);
        try {
          const saveResponse = await fetch(`/api/chat/${chatId}/code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              language: selectedLanguage.id
            }),
          });

          const saveData = await saveResponse.json();

          if (saveResponse.ok) {
            codeSubmissionId = saveData.codeSubmission.id;
          } else {
            console.error('Failed to save code before evaluation');
          }
        } catch (error) {
          console.error('Error saving code before evaluation:', error);
        } finally {
          setIsSaving(false);
        }
      }

      const response = await fetch('/api/code-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          problem: currentProblem,
          targetJobTitle: "Software Engineer",
          sessionId: chatId,
          codeSubmissionId
        }),
      })

      if (!response.ok) throw new Error('Failed to evaluate code')

      const result = await response.json()
      
      // Call the callback with the evaluation result
      if (onEvaluationComplete) {
        onEvaluationComplete(result.evaluation)
      }
    } catch (error) {
      toast.error('Failed to evaluate code')
      console.error('Evaluation error:', error)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleSaveCode = async () => {
    if (!code.trim() || isSaving) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/chat/${chatId}/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language: selectedLanguage.id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error === 'No question message found in this session') {
          toast.error('Please ask a question first before saving code')
        } else {
          toast.error(data.error || 'Failed to save code')
        }
        return
      }

      toast.success('Code saved successfully')
    } catch (error) {
      console.error('Error saving code:', error)
      toast.error('Failed to save code')
    } finally {
      setIsSaving(false)
    }
  }

  // Add resize handler
  useEffect(() => {
    const handleResize = () => {
      // Ensure terminal height doesn't exceed screen bounds
      const windowHeight = window.innerHeight
      const maxAllowedHeight = windowHeight * 0.6 // 60% of screen height
      setTerminalHeight(prev => Math.min(prev, maxAllowedHeight))
    }

    // Initial call
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true)
    dragStartY.current = e.clientY
    dragStartHeight.current = terminalHeight
    
    // Add temporary event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const delta = dragStartY.current - e.clientY
      const newHeight = Math.min(
        Math.max(dragStartHeight.current + delta, minTerminalHeight),
        maxTerminalHeight
      )
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

  return (
    <div className="w-1/2 flex flex-col h-screen bg-[#1E1E1E]">
      {/* Header with language selector and buttons */}
      <div className="border-b border-zinc-800 p-4 bg-[#1E1E1E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-400">Language:</span>
            <Select
              value={selectedLanguage.id}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-[140px] h-8 bg-[#252526] border-zinc-800 text-white">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent className="bg-[#252526] border-zinc-800">
                {languages.map((language) => (
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
              onClick={handleSaveCode}
              disabled={isSaving || !code.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSaving ? (
                <>
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookmarkIcon className="h-4 w-4 mr-2" />
                  Save Code
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
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-zinc-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Code Editor - adjust height based on terminal state */}
      <div 
        className="flex-grow"
        style={{
          height: isTerminalMinimized 
            ? 'calc(100vh - 80px)' 
            : `calc(100vh - ${terminalHeight + 80}px)`
        }}
      >
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
        className="relative border-t border-zinc-800 bg-[#1E1E1E] overflow-hidden"
        style={{
          height: isTerminalMinimized ? '40px' : `${terminalHeight}px`,
          transition: isDragging ? 'none' : 'height 0.3s ease-in-out'
        }}
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
  )
} 