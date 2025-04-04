'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { BookmarkIcon, CheckCircleIcon, ArrowPathIcon } from "@heroicons/react/24/solid"
import { FileText, X } from 'lucide-react'
import { toast } from 'sonner'

interface NotepadPanelProps {
  chatId: string
  currentProblem?: string
  onEvaluationComplete?: (evaluation: string) => void
  onClose: () => void
}

export function NotepadPanel({ chatId, currentProblem, onEvaluationComplete, onClose }: NotepadPanelProps) {
  const [notepadContent, setNotepadContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Load saved content on mount
  useEffect(() => {
    const loadSavedContent = async () => {
      try {
        const response = await fetch(`/api/chat/${chatId}/code?language=text`)
        if (!response.ok) {
          throw new Error('Failed to fetch saved content')
        }

        const { codeSubmission } = await response.json()
        
        if (codeSubmission && codeSubmission.language === 'text') {
          setNotepadContent(codeSubmission.code)
          toast.success('Loaded saved content')
        }
      } catch (error) {
        console.error('Error loading saved content:', error)
      }
    }

    loadSavedContent()
  }, [chatId])

  const handleSaveContent = async () => {
    if (!notepadContent.trim() || isSaving) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/chat/${chatId}/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: notepadContent,
          language: 'text'
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400 && data.error === 'No question message found in this session') {
          toast.error('Please ask a question first before saving content')
        } else {
          toast.error(data.error || 'Failed to save content')
        }
        return
      }

      toast.success('Content saved successfully')
    } catch (error) {
      console.error('Error saving content:', error)
      toast.error('Failed to save content')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEvaluate = async () => {
    if (!notepadContent.trim() || isEvaluating) return;
    setIsEvaluating(true);

    try {
      // First save the content
      await handleSaveContent();

      // Get the latest code submission
      const response = await fetch(`/api/chat/${chatId}/code?language=text`);
      if (!response.ok) {
        throw new Error('Failed to get code submission');
      }
      const { codeSubmission } = await response.json();

      // Evaluate the content
      const evalResponse = await fetch('/api/code-evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: notepadContent,
          problem: currentProblem || '',
          targetJobTitle: 'Software Engineer',
          sessionId: chatId,
          codeSubmissionId: codeSubmission?.id,
          language: 'text'
        }),
      });

      if (!evalResponse.ok) {
        throw new Error('Failed to evaluate content');
      }

      const { evaluation } = await evalResponse.json();
      onEvaluationComplete?.(evaluation);
    } catch (error) {
      console.error('Error evaluating content:', error);
      toast.error('Failed to evaluate content');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="w-1/2 flex flex-col h-screen bg-[#1E1E1E]">
      {/* Notepad header */}
      <div className="flex justify-between items-center p-2 border-b border-zinc-800 bg-[#252526]">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="font-medium text-sm text-zinc-300">Notepad</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSaveContent}
            disabled={isSaving || !notepadContent.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BookmarkIcon className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={handleEvaluate}
            disabled={isEvaluating || !notepadContent.trim() || !currentProblem}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isEvaluating ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Evaluating...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Evaluate
              </>
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Notepad content */}
      <div className="h-full border-b border-zinc-800">
        <textarea
          className="w-full h-full p-4 bg-[#1E1E1E] text-zinc-300 resize-none focus:outline-none font-mono"
          value={notepadContent}
          onChange={(e) => setNotepadContent(e.target.value)}
          placeholder="Take notes here..."
        />
      </div>
    </div>
  )
} 