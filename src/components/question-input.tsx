import { Textarea } from "@/components/ui/textarea"

interface QuestionInputProps {
  value: string
  onChange: (value: string) => void
}

export function QuestionInput({ value, onChange }: QuestionInputProps) {
  return (
    <div className="border rounded-lg p-4 bg-background">
      <h2 className="mb-2 text-lg font-semibold">Question</h2>
      <Textarea
        placeholder="Enter your question here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[200px] resize-none"
      />
    </div>
  )
}

