"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu, Plus, MessageSquare, ChevronRight, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from 'date-fns';
import { FeedbackModal } from "@/components/feedback/FeedbackModal"

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    message: string;
    sender: 'user' | 'assistant';
  }>;
}

const navigationItems = [
  { icon: HelpCircle, label: 'Feedback', href: '/feedback' },
];

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const router = useRouter();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  
  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleNewChat = () => {
    router.push('/chat');
    setIsOpen(false);
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/chat/${sessionId}`);
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed left-4 top-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 border-border bg-background hover:bg-accent"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-[300px] p-0 border-border bg-background"
          >
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle className="text-lg font-semibold">Round0 AI Assistant</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                Your AI programming companion
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col h-full p-3 space-y-4">
              {/* New Chat Button */}
              <Button
                variant="secondary"
                className="w-full justify-start gap-2 font-medium"
                onClick={handleNewChat}
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>

              {/* Navigation Section */}
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start text-sm gap-2 font-normal text-foreground/80 hover:bg-accent"
                    onClick={() => {
                      if (item.label === 'Feedback') {
                        setIsFeedbackOpen(true)
                        setIsOpen(false)
                      } else {
                        router.push(item.href)
                      }
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </div>

              {/* Recent Chats Section */}
              <div className="space-y-2">
                <div className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Recent Chats
                </div>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-1 pr-2">
                    {sessions.map((chat) => (
                      <Button
                        key={chat.id}
                        variant="ghost"
                        className="w-full justify-start text-sm gap-2 font-normal text-foreground/80 hover:bg-accent py-2"
                        onClick={() => handleSessionClick(chat.id)}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate">{chat.title}</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <FeedbackModal 
        isOpen={isFeedbackOpen} 
        onClose={() => setIsFeedbackOpen(false)} 
      />
    </>
  );
} 