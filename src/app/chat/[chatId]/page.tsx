import { Suspense } from 'react'
import { ChatSession } from '@/components/chat/ChatSession'

export default async function ChatSessionPage({
  params,
}: {
  params: { chatId: string }
}) {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-black">Loading...</div>}>
      <ChatSession chatId={params.chatId} />
    </Suspense>
  )
} 