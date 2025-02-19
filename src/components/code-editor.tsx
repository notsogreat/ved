import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isAnalyzing: boolean
}

export function CodeEditor({ value, onChange, onRun, isAnalyzing }: CodeEditorProps) {
  return (
    <div className="border rounded-lg p-4 flex-grow bg-background">
      <h2 className="mb-2 text-lg font-semibold">Code Editor</h2>
      <Textarea
        placeholder="Write your code here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[calc(100%-80px)] font-mono resize-none"
      />
      <div className="flex justify-between items-center mt-4">
        <Button onClick={onRun}>
          <Play className="w-4 h-4 mr-2" />
          Run
        </Button>
        {isAnalyzing && <span className="text-green-500 font-semibold">Analyzing...</span>}
      </div>
    </div>
  )
}

