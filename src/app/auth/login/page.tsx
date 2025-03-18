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

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)

    // Add your login logic here
    
    setTimeout(() => {
      setIsLoading(false)
      router.push('/chat')
    }, 3000)
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
              onClick={() => router.push('/auth/signup')}
            >
              Sign Up
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
              "Learning never exhausts the mind."
            </p>
            <p className="text-sm text-muted-foreground">― Leonardo da Vinci</p>
          </motion.div>

          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome Back</CardTitle>
              <CardDescription>
                Keep learning, keep growing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-end">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push('/auth/forgot-password')}
                >
                  Forgot password?
                </Button>
              </div>
              <Button 
                className="w-full" 
                disabled={isLoading} 
                onClick={onSubmit}
              >
                {isLoading && (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign In
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm"
                  onClick={() => router.push('/auth/signup')}
                >
                  Sign up
                </Button>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
} 