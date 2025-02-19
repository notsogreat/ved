'use client'

import type { ReactNode } from "react"
import { Header } from "@/components/header"
import { LearningHistory } from "@/components/learning-history"
import { useTheme } from "@/hooks/useTheme"
import { useLearningHistory } from "@/hooks/useLearningHistory"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isDarkMode, toggleTheme } = useTheme()
  const { isHistoryOpen, toggleHistory } = useLearningHistory()

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? "dark" : ""}`}>
      <Header onToggleTheme={toggleTheme} isDarkMode={isDarkMode} onToggleHistory={toggleHistory} />
      <main className="flex-grow">{children}</main>
      <LearningHistory isOpen={isHistoryOpen} onClose={toggleHistory} />
    </div>
  )
}

