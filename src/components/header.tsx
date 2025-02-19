'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Moon, Sun, BookOpen } from "lucide-react"

interface HeaderProps {
  onToggleTheme: () => void
  isDarkMode: boolean
  onToggleHistory: () => void
}

export function Header({ onToggleTheme, isDarkMode, onToggleHistory }: HeaderProps) {
  return (
    <header className="flex justify-between items-center p-4 bg-background border-b">
      <Link href="/" className="text-2xl font-bold">
        GoLearn AI
      </Link>
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onToggleTheme}>
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" onClick={onToggleHistory}>
          <BookOpen className="h-4 w-4 mr-2" />
          Learning History
        </Button>
      </div>
    </header>
  )
}

