'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { FileText, X } from 'lucide-react'

interface NotepadPanelProps {
  onClose: () => void
}

export function NotepadPanel({ onClose }: NotepadPanelProps) {
  const [notepadContent, setNotepadContent] = useState("")

  return (
    <div className="w-1/2 flex flex-col h-screen bg-background">
      {/* Notepad header */}
      <div className="flex justify-between items-center p-2 border-b border-border bg-muted">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Notepad</span>
        </div>
        
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Notepad content */}
      <div className="h-full border-b border-border">
        <textarea
          className="w-full h-full p-4 bg-background text-foreground resize-none focus:outline-none"
          value={notepadContent}
          onChange={(e) => setNotepadContent(e.target.value)}
          placeholder="Take notes here..."
        />
      </div>
    </div>
  )
} 