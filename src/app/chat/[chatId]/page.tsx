import { Suspense } from 'react'
import { ChatSession } from '@/components/chat/ChatSession'

interface PageProps {
  params: Promise<{ chatId: string }> | { chatId: string }
}

export default async function ChatSessionPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params)
  const chatId = resolvedParams.chatId

  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>}>
      <ChatSession chatId={chatId} />
    </Suspense>
  )
} 