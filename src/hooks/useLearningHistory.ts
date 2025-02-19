"use client"

import { useState } from "react"

export function useLearningHistory() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen)
  }

  return { isHistoryOpen, toggleHistory }
}

