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
import { Header } from "@/components/layout/header"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const form = event.target as HTMLFormElement
    const formData = new FormData(form)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      await login(email, password)
      
      // Get the redirect URL from query params or default to /chat
      const searchParams = new URLSearchParams(window.location.search)
      const redirect = searchParams.get('redirect') || '/chat'
      
      router.push(redirect)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSignUp={true} />

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
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
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
                <div className="flex items-center justify-end">
                  <Button 
                    type="button"
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => router.push('/auth/forgot-password')}
                  >
                    Forgot password?
                  </Button>
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
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
} 