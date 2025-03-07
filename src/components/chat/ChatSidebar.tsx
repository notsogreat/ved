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
    <div className="fixed left-4 top-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8 border-[#343541]/20 bg-[#202123] hover:bg-[#2A2B32]"
          >
            <Menu className="h-4 w-4 text-[#ECECF1]" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-[260px] p-0 border-[#2A2B32] bg-[#202123]"
        >
          <SheetHeader className="px-2 py-2 border-b border-[#2A2B32]">
            <SheetTitle className="text-[#ECECF1]">Ved AI Assistant</SheetTitle>
            <SheetDescription className="text-[#ECECF1]/60">Your AI programming companion</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col h-full p-2 space-y-4">
            {/* New Chat Button */}
            <Button
              variant="outline"
              className="w-full bg-transparent border border-[#343541]/20 hover:bg-[#343541] text-white hover:text-white"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>

            {/* Navigation Section */}
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Button
                  key={item.label}
                  variant="ghost"
                  className="w-full justify-start text-sm font-normal text-[#ECECF1]/90 hover:bg-[#343541] hover:text-[#ECECF1]/90"
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Recent Chats Section */}
            <div className="space-y-2">
              <div className="px-2 text-xs font-medium text-[#ECECF1]/50 uppercase">
                Recent Chats
              </div>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-1">
                  {sessions.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      className="w-full justify-start text-sm font-normal text-[#ECECF1]/90 hover:bg-[#343541] hover:text-[#ECECF1]/90 py-1.5 px-2"
                      onClick={() => handleSessionClick(chat.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                      <span className="truncate">{chat.title}</span>
                    </Button>
                  ))}
                  {sessions.length > 0 && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm font-normal text-[#ECECF1]/50 hover:bg-[#343541] hover:text-[#ECECF1]/50 py-1.5 px-2"
                      onClick={() => router.push('/chat/history')}
                    >
                      <ChevronRight className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 