'use client'

import { use } from 'react'
import { redirect } from 'next/navigation'
import StreamChatPage from '../page'

export default function ConversationPage({ params }: { params: { id: string } }) {
  // Use React.use to unwrap params promise
  const unwrappedParams = use(params as unknown as Promise<{ id: string }>)
  const id = unwrappedParams.id
  
  // Check if ID is valid UUID format
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  
  // If ID isn't valid UUID format, redirect to the main stream page
  if (!isValidUUID) {
    redirect('/chat/stream')
  }
  
  // Pass the conversation ID as a prop to StreamChatPage
  return <StreamChatPage initialConversationId={id} />
} 