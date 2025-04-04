'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PaperClipIcon, ArrowUpIcon, PlayIcon } from "@heroicons/react/24/outline"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { Circle, User, Code, FileText, X, ArrowRight, Save } from 'lucide-react'
import { useChat } from '@ai-sdk/react'
import Editor from '@monaco-editor/react'
import { CodeEditorPanel } from "@/components/chat/CodeEditorPanel"
import { NotepadPanel } from "@/components/chat/NotepadPanel"
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

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

// Add MarkdownMessage component before the StreamChatPage component
const MarkdownMessage = ({ content }: { content: string }) => {
  const components = {
    h1: ({ children, ...props }: any) => (
      <h1 className="text-2xl font-bold mb-4 mt-6" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-xl font-bold mb-3 mt-5" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-lg font-bold mb-2 mt-4" {...props}>{children}</h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 className="text-base font-bold mb-2 mt-3" {...props}>{children}</h4>
    ),
    p: ({ children, ...props }: any) => (
      <p className="mb-4" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc pl-6 mb-4 space-y-2" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal pl-6 mb-4 space-y-2" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="marker:text-primary" {...props}>
        {children}
      </li>
    ),
    pre: ({ children, ...props }: any) => (
      <pre className="bg-zinc-800 text-zinc-100 rounded-md p-4 mb-4 overflow-x-auto whitespace-pre font-mono text-sm" {...props}>
        {children}
      </pre>
    ),
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          language={match[1]}
          style={vscDarkPlus}
          PreTag="div"
          className="rounded-md mb-4"
          showLineNumbers={false}
          wrapLines={true}
          customStyle={{
            padding: '1rem',
            whiteSpace: 'pre',
            color: '#e4e4e7',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-zinc-800 text-zinc-100 rounded px-1.5 py-0.5 text-sm" {...props}>
          {children}
        </code>
      )
    },
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-zinc-700 pl-4 mb-4 italic" {...props}>
        {children}
      </blockquote>
    ),
    a: ({ children, ...props }: any) => (
      <a className="text-blue-400 hover:text-blue-300 underline" {...props}>
        {children}
      </a>
    ),
    table: ({ children, ...props }: any) => (
      <div className="overflow-x-auto mb-4">
        <table className="min-w-full divide-y divide-zinc-800" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({ children, ...props }: any) => (
      <th className="px-4 py-2 bg-zinc-800 font-medium" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: any) => (
      <td className="px-4 py-2 border-t border-zinc-800" {...props}>
        {children}
      </td>
    ),
  }

  return (
    <ReactMarkdown components={components}>
      {content}
    </ReactMarkdown>
  )
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
  const savedMessageIdsRef = useRef<Set<string>>(new Set())
  const [showCodepad, setShowCodepad] = useState(false)
  const [showNotepad, setShowNotepad] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [currentProblem, setCurrentProblem] = useState("")
  const [pendingSaves, setPendingSaves] = useState<{[key: string]: NodeJS.Timeout}>({})
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  
  // Function to save message with delay
  const saveMessageWithDelay = useCallback(async (currentId: string, message: string, role: string, messageId: string) => {
    try {
      // Wait a short time to ensure message is complete (3 seconds)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Save assistant message to database
      await fetch(`/api/chat/${currentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          role
        })
      });
      
      console.log(`Successfully saved message: ${message.substring(0, 40)}...`);
    } catch (err) {
      console.error("Error saving message to database:", err);
    } finally {
      // Clear from pending saves
      setPendingSaves(prev => {
        const newPending = {...prev};
        delete newPending[messageId];
        return newPending;
      });
    }
  }, []);
  
  // Load stored messages from localStorage
  const loadStoredMessages = useCallback((id: string) => {
    try {
      const key = `${MESSAGE_STORAGE_PREFIX}${id}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          setStoredMessages(parsed);
        }
      }
    } catch (error) {
      console.error("Error loading stored messages:", error);
    }
  }, []);
  
  // Add function to fetch messages from database
  const fetchMessagesFromDatabase = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chat/${id}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const fetchedMessages = await response.json();
      
      if (fetchedMessages && fetchedMessages.length > 0) {
        // Transform to format expected by useChat
        const formattedMessages = fetchedMessages.map((msg: any) => ({
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: msg.role,
          content: msg.content,
          parts: [{ type: 'text', text: msg.content }]
        }));
        
        // Set the messages in the AI SDK
        setStoredMessages(formattedMessages);
        
        // Mark all these messages as already saved in the database
        // This prevents re-saving them when the useEffect runs
        fetchedMessages.forEach((msg: any) => {
          const stableMessageId = `db-${msg.role}-${msg.content.length}`;
          savedMessageIdsRef.current.add(stableMessageId);
        });
      }
      
      // Mark messages as loaded
      setMessagesLoaded(true);
    } catch (error) {
      console.error('Error fetching messages from database:', error);
      setMessagesLoaded(true); // Mark as loaded even on error
    }
  }, []);
  
  // Initialize conversation ID from props or params
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      
      const id = initialConversationId || 
                (typeof params.id === 'string' ? params.id : 
                Array.isArray(params.id) ? params.id[0] : null);
      
      if (id) {
        chatIdRef.current = id;
        setConversationId(id);
        
        // Load stored messages for this conversation
        loadStoredMessages(id);
        
        // Fetch messages from the database
        fetchMessagesFromDatabase(id);
      } else {
        // No ID means a new conversation, so mark messages as loaded
        setMessagesLoaded(true);
      }
    }
  }, [initialConversationId, params, loadStoredMessages, fetchMessagesFromDatabase]);
  
  // Setup AI SDK useChat hook
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit: aiHandleSubmit,
    setInput,
    append,
    isLoading: isChatLoading,
    error: chatError
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
      // Only log tool name for clarity if in development
      if (tool.toolCall && process.env.NODE_ENV === 'development') {
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
        // Check if codepad or notepad is needed based on the message content
        const messageContent = message.content || '';
        
        // Check for codepad needs - use a more aggressive detection approach
        if (shouldShowCodepad(messageContent)) {
          setShowCodepad(true);
          setShowNotepad(false); // Close notepad if codepad is opened
        }
        
        // Check for notepad needs
        if (shouldShowNotepad(messageContent)) {
          setShowNotepad(true);
          setShowCodepad(false); // Close codepad if notepad is opened
        }
        
        // Get the current ID
        const currentId = chatIdRef.current || conversationId;
        if (!currentId) {
          console.error('No conversation ID available');
          return;
        }
        
        // Get message content safely
        let messageContentSafe = '';
        if (message.parts && message.parts.length > 0) {
          // Join all text parts and filter out empty ones
          messageContentSafe = message.parts
            .map(part => part.type === 'text' ? part.text : '')
            .filter(text => text.trim() !== '')
            .join('\n');
        } else if (message.content) {
          messageContentSafe = message.content;
        }
        
        // Skip empty messages or messages that only contain whitespace
        if (!messageContentSafe || messageContentSafe.trim() === '') {
          return;
        }
        
        // Generate a more stable message ID for tracking
        const stableMessageId = `${message.id}-${messageContentSafe.length}`;
        
        // Only save if not already saved with the same content length
        if (!savedMessageIdsRef.current.has(stableMessageId) && 
            !savedMessageIdsRef.current.has(message.id) &&
            !savedMessageIdsRef.current.has(`db-assistant-${messageContentSafe.length}`)) {
          // We only want to save complete messages
          // For coding problems, ensure the whole problem is included
          const isComplete = !messageContentSafe.includes('Problem Title:') || 
                           (messageContentSafe.includes('Problem Title:') && 
                            isCompleteProblem(messageContentSafe));
          
          if (isComplete) {
            // Mark this message as saved
            savedMessageIdsRef.current.add(stableMessageId);
            
            // Also mark the original message ID to prevent duplicates
            savedMessageIdsRef.current.add(message.id);
            
            // Schedule message saving with delay
            console.log(`Scheduling save for message: ${messageContentSafe.substring(0, 40)}...`);
            
            // Cancel any existing pending save for this message
            if (pendingSaves[stableMessageId]) {
              clearTimeout(pendingSaves[stableMessageId]);
            }
            
            // Create new save timeout
            const saveTimeout = setTimeout(() => {
              saveMessageWithDelay(currentId, messageContentSafe, 'assistant', stableMessageId);
            }, 1000);
            
            // Store the timeout reference
            setPendingSaves(prev => ({
              ...prev,
              [stableMessageId]: saveTimeout
            }));
          }
        }
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
      
      // Log only the message content for debugging in development
      if (currentMessage && process.env.NODE_ENV === 'development') {
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

  // Simplified detector functions
  const shouldShowCodepad = (content: string): boolean => {
    return content.toLowerCase().includes('you will need a codepad');
  };

  const shouldShowNotepad = (content: string): boolean => {
    return content.toLowerCase().includes('you will need a notepad');
  };

  // Helper function to check if a problem description is complete
  const isCompleteProblem = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    
    // Must have a problem title
    if (!lowerContent.includes('problem title:')) {
      return false;
    }
    
    // Must have at least one of these sections to be considered complete
    return (
      lowerContent.includes('test case') || 
      lowerContent.includes('example:') || 
      lowerContent.includes('input:') ||
      lowerContent.includes('output:') ||
      lowerContent.includes('constraints:') ||
      (lowerContent.includes('given') && lowerContent.includes('return'))
    );
  };

  // Updated hook to use both functions
  useEffect(() => {
    // Check all assistant messages to see if we need to show codepad or notepad
    for (const message of messages) {
      if (message.role === 'assistant' && message.content) {
        // Remove verbose logging and only check functionality

        if (shouldShowCodepad(message.content)) {
          setShowCodepad(true);
          setShowNotepad(false); // Close notepad if codepad is opened
          
          // Check if this message has a problem title but hasn't been saved explicitly
          if (message.content.includes('Problem Title:') && 
              isCompleteProblem(message.content)) {
            
            // Generate a more stable message ID for tracking
            const stableMessageId = `${message.id}-${message.content.length}`;
            
            // Only save if not already marked as saved
            if (!savedMessageIdsRef.current.has(stableMessageId) &&
                !savedMessageIdsRef.current.has(`db-assistant-${message.content.length}`)) {
              
              // Mark this message as saved
              savedMessageIdsRef.current.add(stableMessageId);
              savedMessageIdsRef.current.add(message.id);
              
              console.log(`Saving problem from useEffect: ${message.content.substring(0, 40)}...`);
              
              // Cancel any existing pending save for this message
              if (pendingSaves[stableMessageId]) {
                clearTimeout(pendingSaves[stableMessageId]);
              }
              
              // Get the current conversation ID
              const currentId = chatIdRef.current || conversationId;
              
              // Only proceed if we have a valid conversation ID
              if (currentId) {
                // Create new save timeout
                const saveTimeout = setTimeout(() => {
                  saveMessageWithDelay(currentId, message.content, 'assistant', stableMessageId);
                }, 1000);
                
                // Store the timeout reference
                setPendingSaves(prev => ({
                  ...prev,
                  [stableMessageId]: saveTimeout
                }));
              }
            }
          }
        }
        
        if (shouldShowNotepad(message.content)) {
          setShowNotepad(true);
          setShowCodepad(false); // Close codepad if notepad is opened
        }
      }
    }
    
    // Extract problem information from messages
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
    if (lastAssistantMessage?.content && lastAssistantMessage.content.includes('Problem Title:')) {
      setCurrentProblem(lastAssistantMessage.content);
    }
    
    // Scroll to bottom when messages change
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, conversationId, saveMessageWithDelay, pendingSaves]);

  // Display error if any
  useEffect(() => {
    if (chatError) {
      toast.error('An error occurred: ' + chatError.message);
    }
  }, [chatError]);

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => {
      const event = new Event('submit') as any;
      handleSubmit(event);
    }, 100);
  }, [setInput, handleSubmit]);
  
  // Cleanup pending saves on unmount
  useEffect(() => {
    return () => {
      // Clear all pending timeouts
      Object.values(pendingSaves).forEach(timeout => clearTimeout(timeout));
    };
  }, [pendingSaves]);

  // Update currentProblem when receiving a new problem from the AI
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage?.role === 'assistant' && lastMessage.content.includes('Problem Title:')) {
      setCurrentProblem(lastMessage.content)
    }
  }, [messages])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  // Add loading state for when a conversation ID exists but messages are still loading
  if (conversationId && !messagesLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-foreground">Loading messages...</div>
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
        {/* Sticky Header - Hide when codepad/notepad is shown */}
        {!(showCodepad || showNotepad) && (
          <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2 z-10">
            <Header showSignOut={true} onSignOut={() => router.push('/auth/login')} />
          </header>
        )}

        {/* Main Layout - Split view when codepad or notepad is shown */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Area - Takes full width when no codepad/notepad, otherwise left side */}
          <div className={cn(
            "flex flex-col flex-1 relative overflow-hidden transition-all duration-300 ease-in-out",
            (showCodepad || showNotepad) && "w-1/2 border-r border-border"
          )}>
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

            {/* Quick access buttons for codepad/notepad */}
            {hasMessages && !(showCodepad || showNotepad) && (
              <div className="flex justify-end px-4 py-2 space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                  onClick={() => {
                    setShowCodepad(true);
                    setShowNotepad(false);
                  }}
                >
                  <Code className="h-3.5 w-3.5 mr-1" />
                  <span>Codepad</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center space-x-1"
                  onClick={() => {
                    setShowNotepad(true);
                    setShowCodepad(false);
                  }}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  <span>Notepad</span>
                </Button>
              </div>
            )}

            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto pb-[130px]">
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
                        <div className="prose dark:prose-invert max-w-none">
                          {message.role === 'assistant' ? (
                            <MarkdownMessage content={message.content || ''} />
                          ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Invisible element to scroll to */}
                <div ref={messageEndRef} />
              </div>
            </div>
            
            {/* Fixed Chat Input at Bottom */}
            <div className={cn("absolute bottom-0 left-0 right-0 border-t border-border bg-background", (showCodepad || showNotepad) ? "w-full" : "w-full max-w-4xl mx-auto")}>
              <form className="flex px-4 py-3 md:py-4 gap-2 w-full" onSubmit={handleSubmit}>
                <div className="relative w-full flex flex-col gap-4">
                  {/* Suggestions Grid - Only show when no messages */}
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
          
          {/* Codepad or Notepad - Right side panel when shown */}
          {showCodepad && (
            <CodeEditorPanel 
              chatId={chatIdRef.current || conversationId || ''} 
              currentProblem={currentProblem}
              onEvaluationComplete={(evaluation) => {
                append({
                  role: 'assistant',
                  content: evaluation
                });
              }}
              onClose={() => setShowCodepad(false)}
            />
          )}
          
          {showNotepad && (
            <NotepadPanel 
              chatId={chatIdRef.current || conversationId || ''} 
              currentProblem={currentProblem}
              onEvaluationComplete={(evaluation) => {
                append({
                  role: 'assistant',
                  content: evaluation
                });
              }}
              onClose={() => setShowNotepad(false)} 
            />
          )}
        </div>
      </div>
    </main>
  );
} 