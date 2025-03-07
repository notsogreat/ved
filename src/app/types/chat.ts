import { MessageSender, MessageType } from '@prisma/client'

export interface ChatMessage {
  id?: string
  sessionId: string
  sender: MessageSender
  messageType: MessageType
  message: string
  codeSubmissionId?: string | null
  createdAt?: Date
}

export interface ChatSession {
  id?: string
  userId: string
  title?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export interface CodeSubmission {
  id?: string
  sessionId: string
  chatMessageId: string
  language: string
  code: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ChatResponse {
  message: string
  sessionId: string
  messageId: string
  conversationHistory: {
    role: 'user' | 'assistant'
    content: string
  }[]
} 