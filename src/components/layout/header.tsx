'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Circle } from "lucide-react"

interface HeaderProps {
  showSignUp?: boolean
  showSignIn?: boolean
  showSignOut?: boolean
  onSignOut?: () => void
}

export function Header({ 
  showSignUp = false, 
  showSignIn = false, 
  showSignOut = false,
  onSignOut 
}: HeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
      <div className="container flex h-14 items-center">
        <div className="flex items-center space-x-2">
          <Circle className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Round0</span>
        </div>
        <div className="flex-1" />
        <nav className="flex items-center space-x-4">
          {showSignIn && (
            <Button
              variant="ghost"
              onClick={() => router.push('/auth/login')}
            >
              Sign In
            </Button>
          )}
          {showSignUp && (
            <Button
              onClick={() => router.push('/auth/signup')}
            >
              Get Started
            </Button>
          )}
          {showSignOut && (
            <Button
              variant="ghost"
              onClick={onSignOut}
            >
              Sign Out
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
} 