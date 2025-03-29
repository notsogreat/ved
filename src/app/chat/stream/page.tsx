'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PaperClipIcon, ArrowUpIcon } from "@heroicons/react/24/outline"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { Circle, User } from 'lucide-react'
import { useChat } from '@ai-sdk/react'

const suggestions = [
  { 
    id: 1, 
    title: "Can you help me with",
    subtitle: "Google interview preparation?",
  },
  { 
    id: 2, 
    title: "Help me prepare for",
    subtitle: "Software Engineering role",
  },
  { 
    id: 3, 
    title: "Can you help me with",
    subtitle: "Data Structures for Facebook?",
  },
  { 
    id: 4, 
    title: "Help me practice",
    subtitle: "System Design questions",
  }
]

// Define message storage keys
const MESSAGE_STORAGE_PREFIX = 'chat_messages_'

// Define props interface
interface StreamChatPageProps {
  initialConversationId?: string
}

export default function StreamChatPage({ initialConversationId }: StreamChatPageProps = {}) {
  const router = useRouter()
  const params = useParams()
  const { user, isLoading } = useAuth()
  const [conversationId, setConversationId] = useState<string | null>(null)
  const isInitialRender = useRef(true)
  const isRouteChanging = useRef(false)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const chatIdRef = useRef<string | null>(null)
  const [storedMessages, setStoredMessages] = useState<any[]>([])
  
  // Initialize conversation ID from props or params
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      
      const id = initialConversationId || 
                (typeof params.id === 'string' ? params.id : 
                Array.isArray(params.id) ? params.id[0] : null);
      
      if (id) {
        console.log(`Initial conversation ID set: ${id}`);
        chatIdRef.current = id;
        setConversationId(id);
        
        // Load stored messages for this conversation
        loadStoredMessages(id);
      }
    }
  }, [initialConversationId, params]);
  
  // Load stored messages from localStorage
  const loadStoredMessages = useCallback((id: string) => {
    try {
      const key = `${MESSAGE_STORAGE_PREFIX}${id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          console.log(`Loaded ${parsed.length} messages for session ${id}`);
          setStoredMessages(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading stored messages:", error);
    }
  }, []);
  
  // Setup AI SDK useChat hook
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: aiHandleSubmit,
    setInput,
    append,
    isLoading: isChatLoading,
    error
  } = useChat({
    api: '/api/chat/stream',
    id: chatIdRef.current || conversationId || undefined,
    initialMessages: storedMessages.map(msg => ({
      id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: msg.role,
      content: msg.content,
      parts: [{ type: 'text', text: msg.content }]
    })),
    body: {
      conversationId: chatIdRef.current || conversationId
    },
    maxSteps: 5, // Allow multiple steps for tool calling
    onResponse: (response) => {
      if (!response.ok) {
        toast.error('Failed to get response');
      }
    },
    onToolCall: async (tool) => {
      // Only log tool name for clarity
      if (tool.toolCall) {
        console.log(`[TOOL] Received tool call: ${tool.toolCall.toolName || 'unknown'}`);
        
        // For server-side tools, we just acknowledge and let the server handle it
        if (tool.toolCall.toolName === "storeUserPerformanceScores") {
          return null; // Server will handle this tool execution
        }
      }
      
      // If we get here, it's a client-side tool we don't recognize
      console.warn("[TOOL] Unknown tool call received");
      return "Unknown tool";
    },
    onFinish: async (message) => {
      try {
        // Get the current ID
        const currentId = chatIdRef.current || conversationId;
        if (!currentId) {
          console.error('No conversation ID available');
          return;
        }
        
        // Get message content safely
        const messageContent = message.parts && message.parts[0]?.type === 'text' 
          ? message.parts[0].text 
          : message.content || '';
        
        // Skip empty messages or messages that only contain whitespace
        if (!messageContent || messageContent.trim() === '') {
          console.log('Skipping empty assistant message');
          return;
        }
        
        console.log(`Saving assistant message for conversation: ${currentId}`);
        
        // Save assistant message to database
        try {
          await fetch(`/api/chat/${currentId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: messageContent,
              role: 'assistant'
            })
          });
        } catch (err) {
          console.error("Error saving assistant message to database:", err);
        }
        
        // We don't need to update the local state anymore because the AI SDK is now handling messages
        // Just update localStorage for redundancy (for page refreshes)
        const key = `${MESSAGE_STORAGE_PREFIX}${currentId}`;
        // Use the full messages array from the AI SDK instead of maintaining our own
        const allMessages = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content
        }));
        
        // Make sure to include the current assistant message
        const assistantMsg = {
          id: message.id,
          role: 'assistant',
          content: messageContent
        };
        
        // Check if the message already exists in the array
        const messageExists = allMessages.some(msg => 
          msg.role === 'assistant' && msg.content === messageContent
        );
        
        // Create the updated messages array
        const updatedMessages = messageExists 
          ? allMessages 
          : [...allMessages, assistantMsg];
          
        // Save to localStorage
        localStorage.setItem(key, JSON.stringify(updatedMessages));
      } catch (error) {
        console.error('Error in onFinish:', error);
      }
    },
    // Prepare the request body to include conversation history
    experimental_prepareRequestBody: ({ messages, requestBody }) => {
      // Get the latest user message
      const latestMessage = messages.length > 0 ? 
        messages[messages.length - 1] : null;
      
      // Only include the latest message as "message" if it's from the user
      const currentMessage = latestMessage?.role === 'user' ? latestMessage.content : '';
      
      // Include all previous messages as conversation history
      // but exclude the latest message which we'll send separately
      const formattedHistory = messages.slice(0, latestMessage?.role === 'user' ? -1 : undefined).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Log only the message content for debugging
      if (currentMessage) {
        console.log(`Sending message: "${currentMessage.substring(0, 40)}${currentMessage.length > 40 ? '...' : ''}"`);
      }
      
      // Ensure conversation history is included in the request body
      return {
        ...(requestBody || {}),
        conversationHistory: formattedHistory,
        message: currentMessage,
        conversationId: chatIdRef.current || conversationId
      };
    }
  });

  // Our custom submit handler to ensure session creation happens first
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    
    // If we don't have a conversation ID yet, create one first
    if (!chatIdRef.current) {
      // Generate new UUID
      const newId = uuidv4();
      console.log(`Creating new conversation with ID: ${newId}`);
      
      try {
        // Create session
        const createResponse = await fetch('/api/session/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: newId })
        });

        if (!createResponse.ok) {
          throw new Error('Failed to create chat session');
        }
        
        // Update references
        chatIdRef.current = newId;
        setConversationId(newId);
        console.log(`Created new session: ${newId}`);
        
        // Update URL without navigation
        isRouteChanging.current = true;
        window.history.replaceState({}, '', `/chat/stream/${newId}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        isRouteChanging.current = false;
        
        // Generate title - only once
        fetch('/api/session/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: newId,
            initialMessage: input
          })
        }).catch(err => console.error("Title generation error:", err));
      } catch (error) {
        console.error("Session creation error:", error);
        toast.error("Failed to create conversation");
        return;
      }
    }
    
    // Save user message to database
    const currentId = chatIdRef.current!;
    try {
      await fetch(`/api/chat/${currentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          role: 'user'
        })
      });
    } catch (err) {
      console.error("Error saving user message to database:", err);
      // Continue even if database save fails
    }
    
    // Don't update local state - let AI SDK handle the message state
    // This will prevent duplicate messages from appearing
    
    // Let AI SDK handle the submission
    aiHandleSubmit(e);
    
  }, [input, isChatLoading, aiHandleSubmit]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Display error if any
  useEffect(() => {
    if (error) {
      toast.error('An error occurred: ' + error.message);
    }
  }, [error]);

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const event = new Event('submit') as any;
      handleSubmit(event);
    }, 100);
  }, [setInput, handleSubmit]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const hasMessages = messages.length > 0;

  return (
    <main className="relative flex min-h-svh flex-1 flex-col bg-background">
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        {/* Sticky Header */}
        <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
          <Header showSignOut={true} onSignOut={() => router.push('/auth/login')} />
        </header>

        {/* Scrollable Content Area */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {!hasMessages && (
            <div className="flex justify-center items-center flex-col w-full flex-1">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Circle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Round0 AI Assistant</h1>
              <p className="text-muted-foreground max-w-md text-center px-4">
                This is an AI-powered interview preparation assistant. It helps you practice coding problems,
                system design, and behavioral questions tailored to your target companies.
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="max-w-4xl w-full mx-auto">
            {messages.map((message) => (
              <div key={message.id} className={cn("mb-6", messages.indexOf(message) === 0 && "mt-4")}>
                <div className={cn(
                  "flex items-start gap-3 px-4",
                )}>
                  {message.role === 'assistant' ? (
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Circle className="h-4 w-4 text-primary" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="h-4 w-4 text-foreground" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2 overflow-hidden">
                    <div className="font-medium text-sm">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2 prose-li:marker:text-primary">
                      {message.parts?.map((part, i) => {
                        if (part.type === 'text') {
                          return part.text.split('\n').map((paragraph, j) => (
                            <p key={`${message.id}-${i}-${j}`} className="whitespace-pre-wrap">{paragraph}</p>
                          ));
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messageEndRef} />
          </div>
        </div>

        {/* Fixed Chat Form at Bottom */}
        <div>
          <form className="flex mx-auto px-4 bg-background py-3 md:py-4 gap-2 w-full max-w-4xl" onSubmit={handleSubmit}>
            <div className="relative w-full flex flex-col gap-4">
              {/* Suggestions Grid */}
              {!hasMessages && (
                <div className="grid sm:grid-cols-2 gap-2 w-full">
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="block"
                    >
                      <button
                        className="inline-flex whitespace-nowrap font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
                        onClick={() => handleSuggestionClick(`${suggestion.title} ${suggestion.subtitle}`)}
                      >
                        <span className="font-medium">{suggestion.title}</span>
                        <span className="text-muted-foreground">{suggestion.subtitle}</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Chat Input */}
              <div className="relative">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                  placeholder="Send a message..."
                  rows={2}
                  className="flex w-full border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none rounded-2xl !text-base bg-muted pb-10 dark:border-zinc-700"
                  style={{ height: '98px' }}
                  disabled={isChatLoading}
                />
                
                {/* Send Button */}
                <div className="absolute bottom-0 right-0 p-2 w-fit flex flex-row justify-end">
                  <Button
                    size="icon"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full p-1.5 h-fit border dark:border-zinc-600"
                    onClick={handleSubmit}
                    disabled={isChatLoading || !input.trim()}
                    type="submit"
                  >
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
} 