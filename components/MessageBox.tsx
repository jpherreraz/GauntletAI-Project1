'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SmilePlus, Smile, Search, Reply, X, ChevronRight, ChevronDown, Paperclip, Image as ImageIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTheme } from '@/contexts/ThemeContext'
import { emojiCategories, categoryIcons } from '@/utils/emojiData'
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils"
import { EmojiPicker } from "@/components/EmojiPicker"
import { messageService, Message as DBMessage, DELETED_USER_ID } from '@/src/services/messageService'
import { formatMessageTime, isSameDay } from "@/lib/utils"
import { clerkClient } from '@clerk/nextjs'
import { UserProfileCard } from '@/components/UserProfileCard'
import { userService, UserProfile } from '@/src/services/userService'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@clerk/nextjs'
import { fileService } from '@/src/services/fileService'
import { DragEvent } from 'react'

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

interface MessageBoxProps {
  channel: string;
  isDM?: boolean;
  placeholder?: string;
  recipientId?: string;
}

// Add a constant for deleted user
const DELETED_USER = {
  id: 'deleted_user',
  username: 'Deleted User',
  imageUrl: '/default-avatar.png'  // Add a default avatar image
};

interface MessageAttachment {
  url: string;
  fileType: string;
  fileName: string;
}

export function MessageBox({ channel, isDM = false, placeholder, recipientId }: MessageBoxProps) {
  const { user } = useUser();
  const { userId } = useAuth();
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
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    username: '',
    imageUrl: ''
  });
  const [recipientName, setRecipientName] = useState<string>('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Add logic to handle DM-specific features
  const messageChannel = isDM ? `dm-${channel}` : `channel-${channel}`;

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
        const newMessages = await messageService.getMessages(messageChannel);
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
  }, [messageChannel, isAtBottom, scrollToBottom]);

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

  // Memoize user data to prevent unnecessary re-renders
  const userData = useCallback(() => ({
    id: userId || '',
    imageUrl: user?.imageUrl || '',
    fullName: user?.fullName || user?.username || 'Anonymous',
    username: user?.username || ''
  }), [userId, user]);

  // Get user info once when component mounts or user changes
  useEffect(() => {
    if (user) {
      setUserInfo({
        username: user.fullName || 'Anonymous',
        imageUrl: user.imageUrl || '',
      });
    }
  }, [user]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !userId) return;
    
    try {
      const messageData = {
        channelId: messageChannel,
        userId: userId,
        text: newMessage.trim(),
        username: user?.fullName || 'Anonymous',
        replyToId: replyingTo?.id,
        attachments: attachments
      };

      const { id, timestamp } = await messageService.sendMessage(messageData);
      
      setMessages(prev => {
        const newMessages = [...prev, {
          ...messageData,
          id,
          timestamp
        }].sort((a, b) => a.timestamp - b.timestamp);
        
        if (replyingTo?.id) {
          setExpandedThreads(prev => new Set(prev).add(replyingTo.id));
        }
        
        setTimeout(() => scrollToBottom(false), 0);
        return newMessages;
      });
      
      setNewMessage('');
      setReplyingTo(null);
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setIsEmojiPickerOpen(false)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!userId) return;

    try {
      const success = await messageService.toggleReaction({
        messageId,
        emoji,
        userId: userId,
        username: userData().username
      });

      if (success) {
        // Update local state
        setMessages(prevMessages => prevMessages.map(msg => {
          if (msg.id === messageId) {
            const currentReactions = msg.reactions || {};
            const currentUsers = currentReactions[emoji] || [];
            const hasReacted = currentUsers.includes(userId);

            return {
              ...msg,
              reactions: {
                ...currentReactions,
                [emoji]: hasReacted
                  ? currentUsers.filter(id => id !== userId)
                  : [...currentUsers, userId]
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

  // Move fetchImages outside of useEffect and memoize it
  const fetchImages = useCallback(async (userIds: string[]) => {
    if (isFetchingImages) return;
    setIsFetchingImages(true);

    try {
      const newImages: Record<string, string> = {};
      
      for (const userId of userIds) {
        if (userId === DELETED_USER_ID) {
          newImages[userId] = DELETED_USER.imageUrl;
          continue;
        }

        if (failedImages.has(userId)) continue;

        try {
          const response = await fetch(`/api/user-image?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            newImages[userId] = data.imageUrl;
          } else {
            setFailedImages(prev => new Set(prev).add(userId));
          }
        } catch (error) {
          console.error(`Error fetching image for user ${userId}:`, error);
          setFailedImages(prev => new Set(prev).add(userId));
        }
      }

      setUserImages(prev => ({ ...prev, ...newImages }));
    } finally {
      setIsFetchingImages(false);
    }
  }, [isFetchingImages, failedImages]);

  // Use fetchImages in useEffect
  useEffect(() => {
    if (isFetchingImages) return;

    const uniqueUserIds = [...new Set(messages.map(m => m.userId))];
    const unfetchedUsers = uniqueUserIds.filter(id => 
      !userImages[id] && 
      !failedImages.has(id) && 
      id !== userId
    );

    if (unfetchedUsers.length === 0) return;

    // Debounce the fetch
    const timeoutId = setTimeout(() => fetchImages(unfetchedUsers), 500);
    return () => clearTimeout(timeoutId);
  }, [messages, userId, userImages, failedImages, fetchImages]);

  // Simplified getUserImage function
  const getUserImage = (messageUserId: string) => {
    if (messageUserId === userId) return userInfo.imageUrl;
    return userImages[messageUserId];
  };

  const handleProfileClick = async (userId: string, username: string) => {
    try {
      console.log('Fetching profile for:', { userId, username });
      
      // First try to get the existing profile
      const profile = await userService.getUserProfile(userId);
      console.log('Fetched profile:', profile);

      if (!profile) {
        console.log('Profile not found, creating new one');
        // If no profile exists, create one with basic info
        const newProfile = await userService.updateUserProfile(userId, {
          username,
          status: 'online',
          bio: "Hey there! I'm using GauntletAI Chat."
        });
        console.log('Created new profile:', newProfile);
        setSelectedUser(newProfile);
      } else {
        console.log('Using existing profile');
        setSelectedUser(profile);
      }
    } catch (error) {
      console.error('Error in handleProfileClick:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      // Don't throw the error, just show a toast or notification
      // toast.error('Could not load user profile');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      const uploads = await Promise.all(
        Array.from(files).map(file => fileService.uploadFile(file))
      );
      
      setAttachments(prev => [...prev, ...uploads]);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const renderMessage = useCallback((message: DBMessage, isChained = false, hasReplies = false, isExpanded = false) => {
    const isDeleted = message.userId === DELETED_USER_ID;
    const userImage = isDeleted ? DELETED_USER.imageUrl : userImages[message.userId];

    return (
      <div className="group flex gap-4 px-4 py-2 hover:bg-accent/50">
        {!isChained && (
          <Avatar className="h-8 w-8 mt-0.5">
            <AvatarImage src={userImage} />
            <AvatarFallback>
              {isDeleted ? 'D' : message.username[0]}
            </AvatarFallback>
          </Avatar>
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
                            users.includes(userId) && [
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
  }, [userImages, handleProfileClick, colorScheme, userId, getReplies]);

  // Add this useEffect to log the props
  useEffect(() => {
    console.log('MessageBox mounted with props:', { channel, isDM, placeholder });
  }, [channel, isDM, placeholder]);

  // Cache the auth state
  const [cachedUserId] = useState(userId);

  // Fetch recipient's name when component mounts
  useEffect(() => {
    if (isDM && recipientId) {
      const fetchRecipientName = async () => {
        try {
          const profile = await userService.getUserProfile(recipientId);
          if (profile) {
            setRecipientName(profile.username);
          }
        } catch (error) {
          console.error('Error fetching recipient name:', error);
          setRecipientName('User');
        }
      };

      fetchRecipientName();
    }
  }, [isDM, recipientId]);

  // Add these drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    try {
      const uploads = await Promise.all(
        files.map(file => fileService.uploadFile(file))
      );
      
      setAttachments(prev => [...prev, ...uploads]);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive"
      });
    }
  }, []);

  // Add the file preview component
  const FilePreview = ({ attachment, index }: { attachment: MessageAttachment; index: number }) => {
    return (
      <div className="relative group">
        {attachment.fileType.startsWith('image/') ? (
          <div className="relative w-32 h-32 rounded-md overflow-hidden">
            <img 
              src={attachment.url} 
              alt={attachment.fileName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-md bg-muted flex flex-col items-center justify-center gap-2">
            <Paperclip className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground text-center px-2 truncate max-w-full">
              {attachment.fileName}
            </span>
          </div>
        )}
        <button
          onClick={() => removeAttachment(index)}
          className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col h-full min-h-0 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-primary">
          <div className="text-center">
            <Paperclip className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Drop files to upload</p>
          </div>
        </div>
      )}
      
      <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
        <div ref={scrollAreaRef} className="p-4 space-y-4">
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
      </ScrollArea>

      <div className={cn(
        "border-t p-4 shrink-0 sticky bottom-0",
        `bg-${colorScheme}-600 bg-opacity-10`,
        `border-${colorScheme}-800`
      )}>
        {attachments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <FilePreview 
                key={`${attachment.fileName}-${index}`}
                attachment={attachment}
                index={index}
              />
            ))}
          </div>
        )}

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
          <Textarea
            placeholder={isDM 
              ? `Message ${recipientName || 'loading...'}`
              : `Message #${channel}`
            }
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className={cn(
              "resize-none",
              "min-h-[40px]",
              "max-h-[40px]",
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

