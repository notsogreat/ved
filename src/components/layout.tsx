'use client'

import { Header } from "@/components/layout/header"
import { Toaster } from "@/components/ui/sonner"

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  )
}

