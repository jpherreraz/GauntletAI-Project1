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
import { useUser, useOrganization } from '@clerk/nextjs'
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import { messageService, Message as DBMessage, DELETED_USER_ID } from '@/src/services/messageService'
import { formatMessageTime, isSameDay } from "@/lib/utils"
import { clerkClient } from '@clerk/nextjs'
import { UserProfileCard } from '@/components/UserProfileCard'
import { userService, UserProfile } from '@/src/services/userService'

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

interface DeletedUser {
  isDeleted: true;
  username: "Deleted User";
}

interface ActiveUser {
  isDeleted?: false;
  username: string;
  imageUrl?: string;
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  bio?: string;
}

type UserData = DeletedUser | ActiveUser;

export function MessageBox({ channel }: { channel: string }) {
  const { user } = useUser();
  const { organization } = useOrganization();
  const { colorScheme } = useTheme();
  const [messages, setMessages] = useState<DBMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DBMessage | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [userImages, setUserImages] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isFetchingImages, setIsFetchingImages] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deletedUsers, setDeletedUsers] = useState<Set<string>>(new Set());
  
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
    return messages.filter(m => m.replyToId === messageId);
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
      const success = await messageService.toggleReaction({
        messageId,
        emoji,
        userId: user.id,
        username: user.username || ''
      });

      if (success) {
        // Update local state
        setMessages(prevMessages => prevMessages.map(msg => {
          if (msg.id === messageId) {
            const currentReactions = msg.reactions || {};
            const currentUsers = currentReactions[emoji] || [];
            const hasReacted = currentUsers.includes(user.id);

            return {
              ...msg,
              reactions: {
                ...currentReactions,
                [emoji]: hasReacted
                  ? currentUsers.filter(id => id !== user.id)
                  : [...currentUsers, user.id]
              }
            };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
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

  // Debounced image fetching
  useEffect(() => {
    if (isFetchingImages) return;

    const uniqueUserIds = [...new Set(messages.map(m => m.userId))];
    const unfetchedUsers = uniqueUserIds.filter(id => 
      !userImages[id] && 
      !failedImages.has(id) && 
      id !== user?.id
    );

    if (unfetchedUsers.length === 0) return;

    const fetchImages = async () => {
      setIsFetchingImages(true);
      
      try {
        const results = await Promise.all(
          unfetchedUsers.map(async userId => {
            try {
              const res = await fetch(`/api/user-image?userId=${userId}`);
              if (!res.ok) throw new Error('Failed to fetch');
              const data = await res.json();
              return { userId, imageUrl: data.imageUrl };
            } catch {
              return { userId, imageUrl: null };
            }
          })
        );

        setUserImages(prev => {
          const newImages = { ...prev };
          results.forEach(({ userId, imageUrl }) => {
            if (imageUrl) newImages[userId] = imageUrl;
          });
          return newImages;
        });

        setFailedImages(prev => {
          const newFailed = new Set(prev);
          results.forEach(({ userId, imageUrl }) => {
            if (!imageUrl) newFailed.add(userId);
          });
          return newFailed;
        });
      } finally {
        setIsFetchingImages(false);
      }
    };

    // Debounce the fetch
    const timeoutId = setTimeout(fetchImages, 500);
    return () => clearTimeout(timeoutId);
  }, [messages, user?.id, isFetchingImages]);

  // Simplified getUserImage function
  const getUserImage = (userId: string) => {
    if (userId === user?.id) return user.imageUrl;
    return userImages[userId];
  };

  const handleProfileClick = async (userId: string, username: string) => {
    try {
      let profile = await userService.getUserProfile(userId);
      
      if (profile?.isDeleted) {
        setDeletedUsers(prev => new Set(prev).add(userId));
        return;
      }

      if (!profile) {
        // Make sure we're using the display name from the message
        const validUsername = username || 'Anonymous';
        
        // Create a default profile if none exists
        await userService.updateUserProfile({
          userId,
          username: validUsername, // Use the message's username instead of defaulting to Anonymous
          status: 'online',
          imageUrl: getUserImage(userId),
          bio: "Hey there! I'm using GauntletAI Chat."
        });
        
        profile = await userService.getUserProfile(userId);
      }

      if (profile) {
        setSelectedUser(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const renderMessage = (message: DBMessage, isChained: boolean, hasReplies: boolean, isExpanded: boolean) => {
    const isDeleted = message.userId === DELETED_USER_ID || deletedUsers.has(message.userId);
    
    return (
      <div className={cn(
        "relative group flex items-start gap-2",
        isChained ? "mt-0.5" : "mt-4"
      )}>
        {!isChained ? (
          <Avatar 
            className={cn(
              "h-8 w-8",
              !isDeleted && "cursor-pointer hover:opacity-80"
            )}
            onClick={() => !isDeleted && handleProfileClick(message.userId, message.username)}
          >
            <AvatarImage src={getUserImage(message.userId)} />
            <AvatarFallback>
              {isDeleted ? "?" : message.username[0]}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8" />
        )}
        
        <div className="flex-1">
          {!isChained && (
            <div className="flex items-center gap-2 mb-1">
              <span 
                className={cn(
                  "font-medium",
                  !isDeleted && "cursor-pointer hover:underline"
                )}
                onClick={() => !isDeleted && handleProfileClick(message.userId, message.username)}
              >
                {isDeleted ? "Deleted User" : message.username}
              </span>
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
                <div>
                  {isDeleted ? (
                    <span className="italic text-muted-foreground">
                      {message.text}
                    </span>
                  ) : (
                    message.text
                  )}
                </div>
                {message.reactions && Object.entries(message.reactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(message.reactions).map(([emoji, users]) => (
                      users.length > 0 && (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-6 px-2 py-1 text-xs rounded-full",
                            `bg-${colorScheme}-600 bg-opacity-15`,
                            users.includes(user?.id || '') && [
                              "border border-blue-400/50",
                              "text-blue-400"
                            ]
                          )}
                          onClick={() => handleReaction(message.id, emoji)}
                        >
                          {emoji} {users.length}
                        </Button>
                      )
                    ))}
                  </div>
                )}
                {hasReplies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 h-5 px-1.5"
                    onClick={() => {
                      setExpandedThreads(prev => {
                        const newSet = new Set(prev);
                        if (isExpanded) {
                          newSet.delete(message.id);
                        } else {
                          newSet.add(message.id);
                        }
                        return newSet;
                      });
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-2.5 w-2.5" />
                    ) : (
                      <ChevronRight className="h-2.5 w-2.5" />
                    )}
                    {getReplies(message.id).length} {getReplies(message.id).length === 1 ? 'reply' : 'replies'}
                  </Button>
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
                {!isDeleted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleReply(message)}
                  >
                    <Reply className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {isExpanded && hasReplies && (
              <div className="ml-4 mt-2 space-y-2 border-l-2 border-muted pl-4">
                {getReplies(message.id).map((reply) => {
                  const isReplyDeleted = reply.userId === DELETED_USER_ID || deletedUsers.has(reply.userId);
                  
                  return (
                    <div key={reply.id} className="flex items-start gap-2">
                      <Avatar 
                        className={cn(
                          "h-6 w-6",
                          !isReplyDeleted && "cursor-pointer hover:opacity-80"
                        )}
                        onClick={() => !isReplyDeleted && handleProfileClick(reply.userId, reply.username)}
                      >
                        <AvatarImage src={getUserImage(reply.userId)} />
                        <AvatarFallback>{isReplyDeleted ? "?" : reply.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className={cn(
                              "text-sm font-medium",
                              !isReplyDeleted && "cursor-pointer hover:underline"
                            )}
                            onClick={() => !isReplyDeleted && handleProfileClick(reply.userId, reply.username)}
                          >
                            {isReplyDeleted ? "Deleted User" : reply.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(reply.timestamp)}
                          </span>
                        </div>
                        <div className={cn(
                          "p-2 rounded-lg mt-1",
                          `bg-${colorScheme}-600 bg-opacity-20`
                        )}>
                          {isReplyDeleted ? (
                            <span className="italic text-muted-foreground">
                              {reply.text}
                            </span>
                          ) : (
                            reply.text
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                        {renderMessage(message, isChained, hasReplies, isExpanded)}
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
      {selectedUser && (
        <UserProfileCard
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
        />
      )}
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

