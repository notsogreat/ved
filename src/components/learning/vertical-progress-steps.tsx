'use client'

import { CheckCircle2, Circle, CircleDot } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface Step {
  title: string
  status: 'complete' | 'in-progress' | 'not-started'
}

interface VerticalProgressStepsProps {
  steps: Step[]
  currentStep: number
}

export function VerticalProgressSteps({ steps, currentStep }: VerticalProgressStepsProps) {
  return (
    <Card className="p-4 border bg-card">
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className="flex h-6 w-6 items-center justify-center">
                {step.status === 'complete' ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : step.status === 'in-progress' ? (
                  <CircleDot className="h-6 w-6 text-primary" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              {index !== steps.length - 1 && (
                <div className="w-px h-12 bg-border" />
              )}
            </div>
            <div className="ml-4 pb-8">
              <p className={cn(
                "text-sm font-medium",
                step.status === 'complete' ? "text-primary" : 
                step.status === 'in-progress' ? "text-foreground" : 
                "text-muted-foreground"
              )}>
                {step.title}
              </p>
              {step.status === 'in-progress' && (
                <div className="mt-2">
                  <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-in-out"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 