'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SmilePlus, Smile, Search, Reply, X, ChevronRight, ChevronDown } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/contexts/ThemeContext'
import { emojiCategories, categoryIcons } from '@/utils/emojiData'
import { useUser } from '@clerk/nextjs'
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import { messageService, Message as DBMessage } from '@/src/services/messageService'
import { formatMessageTime, isSameDay } from "@/lib/utils";

interface Reaction {
  emoji: string
  count: number
  users: string[]
}

interface DBMessage {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: number;
  username: string;
  replyToId?: string;
  reactions?: { [emoji: string]: string[] }; // Map of emoji to array of user IDs
}

export function MessageBox({ channel }: { channel: string }) {
  const { user } = useUser();
  const { colorScheme } = useTheme();
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DBMessage | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Function to check if scrolled to bottom
  const isNearBottom = useCallback(() => {
    const container = scrollAreaRef.current;
    if (!container) return false;
    
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // Function to scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    setIsAtBottom(isNearBottom());
  }, [isNearBottom]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const newMessages = await messageService.getMessages(channel);
        const sortedMessages = newMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        setMessages(prev => {
          // Preserve reply structure by comparing with existing messages
          const mergedMessages = sortedMessages.map(newMsg => {
            const existingMsg = prev.find(p => p.id === newMsg.id);
            // Keep existing replyToId if it exists
            return existingMsg?.replyToId ? { ...newMsg, replyToId: existingMsg.replyToId } : newMsg;
          });

          if (isAtBottom && JSON.stringify(prev) !== JSON.stringify(mergedMessages)) {
            setTimeout(() => scrollToBottom(false), 0);
          }
          return mergedMessages;
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [channel, isAtBottom, scrollToBottom]);

  // Add scroll event listener
  useEffect(() => {
    const container = scrollAreaRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      // Initial scroll position check
      setIsAtBottom(isNearBottom());
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, isNearBottom]);

  // Helper to get replies for a message
  const getReplies = useCallback((messageId: string) => {
    return messages.filter(m => m.replyToId === messageId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [messages]);

  // Toggle thread expansion
  const toggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) {
      console.log('No user or empty message');
      return;
    }

    try {
      const messageData = {
        channelId: channel,
        userId: user.id,
        text: newMessage.trim(),
        username: user.fullName || user.username || 'Anonymous',
        replyToId: replyingTo?.id
      };

      const { id, timestamp } = await messageService.sendMessage(messageData);
      
      setMessages(prev => {
        const newMessages = [...prev, {
          ...messageData,
          id,
          timestamp
        }].sort((a, b) => a.timestamp - b.timestamp);
        
        // If this is a reply, expand the thread
        if (replyingTo?.id) {
          setExpandedThreads(prev => new Set(prev).add(replyingTo.id));
        }
        
        setTimeout(() => scrollToBottom(false), 0);
        return newMessages;
      });
      
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setIsEmojiPickerOpen(false)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    
    try {
      await messageService.toggleReaction({
        messageId,
        emoji,
        userId: user.id,
        username: user.fullName || user.username || 'Anonymous'
      });

      // Refresh messages to get updated reactions
      const updatedMessages = await messageService.getMessages(channel);
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    return groupMessagesByDate(messages)
  }, [messages])

  // Helper function to check if messages should be chained
  const shouldChainMessage = (message: DBMessage, prevMessage?: DBMessage) => {
    if (!prevMessage) return false;
    
    const timeDiff = message.timestamp - prevMessage.timestamp;
    const isWithinTimeWindow = timeDiff < 5 * 60 * 1000; // 5 minutes
    return prevMessage.userId === message.userId && isWithinTimeWindow;
  };

  const handleReply = (message: DBMessage) => {
    setReplyingTo(message);
    // Focus the input after setting the reply
    const input = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  };

  // Filter main messages (non-replies) for the initial render
  const mainMessages = messages.filter(m => !m.replyToId);

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute inset-0 flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          <div ref={scrollAreaRef} className="h-full">
            <div className="p-4 space-y-4">
              {groupedMessages.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="text-center mb-4">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(group[0].timestamp)}
                    </span>
                  </div>
                  
                  {group.filter(m => !m.replyToId).map((message, messageIndex) => {
                    const prevMessage = group[messageIndex - 1];
                    const isChained = shouldChainMessage(message, prevMessage);
                    const replies = getReplies(message.id);
                    const hasReplies = replies.length > 0;
                    const isExpanded = expandedThreads.has(message.id);
                    
                    return (
                      <div key={message.id}>
                        <div className={cn(
                          "relative group flex items-start gap-2",
                          isChained ? "mt-0.5" : "mt-4"
                        )}>
                          {!isChained ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={message.userId === user?.id 
                                  ? user?.imageUrl 
                                  : `https://api.dicebear.com/7.x/initials/svg?seed=${message.username}`
                                } 
                              />
                              <AvatarFallback>{message.username[0]}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8" />
                          )}
                          
                          <div className="flex-1">
                            {!isChained && (
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{message.username}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(message.timestamp)}
                                </span>
                              </div>
                            )}
                            
                            <div className="group relative">
                              <div className="flex items-center gap-2">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  `bg-${colorScheme}-600 bg-opacity-20`
                                )}>
                                  <div>{message.text}</div>
                                  
                                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {Object.entries(message.reactions).map(([emoji, users]) => (
                                        Array.isArray(users) && users.length > 0 && (
                                          <button
                                            key={emoji}
                                            onClick={() => handleReaction(message.id, emoji)}
                                            className={cn(
                                              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                                              `hover:bg-${colorScheme}-600 hover:bg-opacity-30`,
                                              `bg-${colorScheme}-600 bg-opacity-20`,
                                              users.includes(user?.id || '') && `bg-${colorScheme}-600 bg-opacity-40`
                                            )}
                                          >
                                            <span>{emoji}</span>
                                            <span>{users.length}</span>
                                          </button>
                                        )
                                      ))}
                                    </div>
                                  )}

                                  {hasReplies && (
                                    <div className="mt-2">
                                      <button
                                        onClick={() => toggleThread(message.id)}
                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                      >
                                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                        {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className={cn(
                                  "opacity-0 group-hover:opacity-100 transition-opacity",
                                  "flex items-center gap-1"
                                )}>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <SmilePlus className="h-4 w-4" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[288px] p-0" align="start" side="top">
                                      <EmojiPicker onEmojiSelect={(emoji) => handleReaction(message.id, emoji)} />
                                    </PopoverContent>
                                  </Popover>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleReply(message)}
                                  >
                                    <Reply className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {isExpanded && hasReplies && (
                                <div className="ml-4 mt-2 space-y-2 border-l-2 border-muted pl-4">
                                  {replies.map((reply) => (
                                    <div key={reply.id} className="flex items-start gap-2">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={reply.userId === user?.id ? user?.imageUrl : undefined} />
                                        <AvatarFallback>{reply.username[0]}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium">{reply.username}</span>
                                          <span className="text-xs text-muted-foreground">
                                            {formatMessageTime(reply.timestamp)}
                                          </span>
                                        </div>
                                        <div className={cn(
                                          "p-2 rounded-lg mt-1",
                                          `bg-${colorScheme}-600 bg-opacity-20`
                                        )}>
                                          {reply.text}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={scrollRef} className="h-0 w-full" />
            </div>
          </div>
        </ScrollArea>

        <div className={cn(
          "border-t p-4 mt-auto",
          `bg-${colorScheme}-600 bg-opacity-10`,
          `border-${colorScheme}-800`
        )}>
          {replyingTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
              <Reply className="h-4 w-4" />
              <div className="flex-1">
                <div className="font-medium">
                  Replying to {replyingTo.username}
                </div>
                <div className="text-xs truncate">
                  {replyingTo.text}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted/50"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? `Reply to ${replyingTo.username}...` : `Message #${channel}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className={cn(
                "text-white placeholder:text-white/50 pr-10 border-0",
                "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none",
                `bg-${colorScheme}-600 bg-opacity-20`
              )}
            />
            <Popover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={cn(
                    "absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0",
                    `hover:bg-${colorScheme}-600`,
                    "hover:bg-opacity-15",
                    "transition-colors group"
                  )}
                >
                  <Smile className="h-5 w-5 transition-transform group-hover:scale-125" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[288px] p-0" align="end" side="top" sideOffset={10}>
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to group messages by date
function groupMessagesByDate(messages: DBMessage[]) {
  return Object.values(
    messages.reduce((groups, message) => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
      return groups
    }, {} as Record<string, DBMessage[]>)
  )
}

// Helper function to format date
function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString()
  }
}

