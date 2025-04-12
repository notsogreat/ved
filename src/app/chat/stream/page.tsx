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
  const [showCodepad, setShowCodepad] = useState(false)
  const [showNotepad, setShowNotepad] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [currentProblem, setCurrentProblem] = useState("")
  const [messagesLoaded, setMessagesLoaded] = useState(false)
  
  // Simplified message loading function
  const loadMessages = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/chat/${id}/messages`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const fetchedMessages = await response.json();
      setMessagesLoaded(true);
      return fetchedMessages;
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessagesLoaded(true);
      return [];
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
        loadMessages(id);
      } else {
        setMessagesLoaded(true);
      }
    }
  }, [initialConversationId, params, loadMessages]);
  
  // Setup AI SDK useChat hook with simplified message handling
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
    body: {
      conversationId: chatIdRef.current || conversationId
    },
    maxSteps: 5,
    onResponse: (response) => {
      if (!response.ok) {
        toast.error('Failed to get response');
      }
    },
    onFinish: async (message) => {
      try {
        // Check if codepad or notepad is needed
        const messageContent = message.content || '';
        
        if (shouldShowCodepad(messageContent)) {
          setShowCodepad(true);
          setShowNotepad(false);
        }
        
        if (shouldShowNotepad(messageContent)) {
          setShowNotepad(true);
          setShowCodepad(false);
        }

        // Get the current ID
        const currentId = chatIdRef.current || conversationId;
        if (!currentId) {
          console.error('No conversation ID available');
          return;
        }

        // Save assistant message to database
        if (message.content) {
          fetch(`/api/chat/${currentId}/message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: message.content,
              role: 'assistant'
            })
          }).catch(err => {
            console.error("Error saving assistant message:", err);
            toast.error("Failed to save message");
          });
        }
      } catch (error) {
        console.error('Error in onFinish:', error);
      }
    },
    // Add back the experimental_prepareRequestBody to handle message history
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
      
      // Ensure conversation history is included in the request body
      return {
        ...(requestBody || {}),
        conversationHistory: formattedHistory,
        message: currentMessage,
        conversationId: chatIdRef.current || conversationId
      };
    }
  });

  // Simplified submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    
    // If we don't have a conversation ID yet, create one first
    if (!chatIdRef.current) {
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
        
        // Generate title in background
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
    
    // Save user message to database in background
    const currentId = chatIdRef.current!;
    fetch(`/api/chat/${currentId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: input,
        role: 'user'
      })
    }).catch(err => {
      console.error("Error saving user message:", err);
      toast.error("Failed to save message");
    });
    
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

  // Updated hook to use both functions
  useEffect(() => {
    // Check all assistant messages to see if we need to show codepad or notepad
    for (const message of messages) {
      if (message.role === 'assistant' && message.content) {
        if (shouldShowCodepad(message.content)) {
          setShowCodepad(true);
          setShowNotepad(false);
        }
        
        if (shouldShowNotepad(message.content)) {
          setShowNotepad(true);
          setShowCodepad(false);
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
  }, [messages]);

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