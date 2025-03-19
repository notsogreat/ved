'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/ui/icons"
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Circle } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const name = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up')
      }

      // After successful signup, log the user in
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok) {
        throw new Error(loginData.error || 'Failed to login after signup')
      }

      // Redirect to chat page
      router.push('/chat')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sign up')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-2">
            <Circle className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">Round0</span>
          </div>
          <div className="flex-1" />
          <nav className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/auth/login')}
            >
              Sign In
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 mt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Quote Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center space-y-2"
          >
            <p className="text-lg text-muted-foreground italic">
              "Live as if you were to die tomorrow. Learn as if you were to live forever."
            </p>
            <p className="text-sm text-muted-foreground">― Mahatma Gandhi</p>
          </motion.div>

          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to Round0</CardTitle>
              <CardDescription>
                Trust me, you made the right choice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Doe"
                    type="text"
                    autoCapitalize="words"
                    autoComplete="name"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    type="password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500 text-center">
                    {error}
                  </div>
                )}
                <Button 
                  type="submit"
                  className="w-full" 
                  disabled={isLoading} 
                >
                  {isLoading && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign Up
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  By clicking Sign Up, you agree to our{" "}
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Terms of Service
                  </Button>
                  {" "}and{" "}
                  <Button variant="link" className="p-0 h-auto text-sm">
                    Privacy Policy
                  </Button>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
} 