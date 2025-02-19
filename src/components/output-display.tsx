interface OutputDisplayProps {
  output: string
}

export function OutputDisplay({ output }: OutputDisplayProps) {
  if (!output) return null

  return (
    <div className="flex-1 border rounded-lg p-4 bg-background">
      <h3 className="mb-2 text-lg font-semibold">Output:</h3>
      <pre className="p-2 bg-muted rounded-md whitespace-pre-wrap">{output}</pre>
    </div>
  )
}

