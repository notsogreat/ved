'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserCircle2, ChevronLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { usePathname } from "next/navigation"

export function Header() {
  const pathname = usePathname()
  const isCodeEditor = pathname === '/learn/code-editor'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            {isCodeEditor && (
              <Link href="/learn">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Vedh AI
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon">
              <UserCircle2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
} 