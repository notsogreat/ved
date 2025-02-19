"use client"

import { useState } from "react"

export function useCodeExecution() {
  const [output, setOutput] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const executeCode = (code: string, question: string) => {
    setIsAnalyzing(true)
    // Simulate code execution and analysis
    setTimeout(() => {
      setOutput(`Executing code:\n\n${code}\n\nQuestion: ${question}`)
      setIsAnalyzing(false)
    }, 2000)
  }

  return { output, isAnalyzing, executeCode }
}

