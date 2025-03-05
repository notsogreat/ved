"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
}

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  
  const chatSessions: ChatSession[] = [
    {
      id: "1",
      title: "Chat about React Components",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      title: "TypeScript Discussion",
      timestamp: "Yesterday",
    },
  ];

  return (
    <div className="fixed left-4 top-4 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 border-[#343541]/20 bg-[#202123] hover:bg-[#2A2B32]">
            <Menu className="h-4 w-4 text-[#ECECF1]" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="left" 
          className="w-[300px] border-[#2A2B32] bg-[#202123]"
        >
          <SheetHeader>
            <SheetTitle className="text-[#ECECF1]">Chat History</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
            <div className="space-y-1">
              {chatSessions.map((chat) => (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className="w-full justify-start font-normal text-[#ECECF1] bg-[#202123] hover:bg-[#2A2B32]"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm">{chat.title}</span>
                    <span className="text-xs text-[#ECECF1]/60">
                      {chat.timestamp}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
} 