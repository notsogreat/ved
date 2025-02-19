"use client"

import { useState, useEffect } from "react"

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle("dark")
  }

  return { isDarkMode, toggleTheme }
}

