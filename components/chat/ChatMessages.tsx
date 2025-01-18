import { FC, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Message as MessageType } from '@/src/types/message';
import { Message } from './Message';
import { useUser, useAuth } from '@clerk/nextjs';
import { messageService } from '@/src/services/messageService';
import { formatDate } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useThread } from '@/contexts/ThreadContext';
import { useInView } from 'react-intersection-observer';

interface ChatMessagesProps {
  messages: MessageType[];
  isLoading: boolean;
  newMessageSent: boolean;
  onReplyClick: (message: MessageType | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  channelId: string;
}

export const ChatMessages: FC<ChatMessagesProps> = ({ 
  messages, 
  isLoading, 
  newMessageSent,
  onReplyClick,
  setMessages,
  channelId
}) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { setActiveThread } = useThread();
  const parentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollTopRef = useRef(0);

  // Use intersection observer to track if bottom is visible
  const { ref: bottomRef, inView: isBottomVisible } = useInView({
    threshold: 0.1,
    root: parentRef.current,
    rootMargin: '0px',
    onChange: (inView) => {
      if (inView && isAtBottom) {
        setUnreadCount(0);
      }
    }
  });

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const element = parentRef.current;
    const maxScroll = element.scrollHeight - element.clientHeight;
    const currentScroll = element.scrollTop;
    // Make the bottom detection more precise
    const scrolledToBottom = maxScroll - currentScroll < 10;
    
    lastScrollTopRef.current = currentScroll;

    if (scrolledToBottom) {
      setIsAtBottom(true);
      setUnreadCount(0);
    } else {
      setIsAtBottom(false);
    }
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (!parentRef.current) return;
    
    const element = parentRef.current;
    element.scrollTop = element.scrollHeight;
    setIsAtBottom(true);
    setUnreadCount(0);
    
    // Force a scroll event to update state
    handleScroll();
  }, [handleScroll]);

  // Watch for new messages
  useEffect(() => {
    // Skip initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      lastMessageCountRef.current = messages.length;
      return;
    }

    // Only check for new messages if we have more messages than before
    if (messages.length > lastMessageCountRef.current) {
      const newMessageCount = messages.length - lastMessageCountRef.current;
      
      // Only scroll if it's our own message
      if (newMessageSent) {
        setTimeout(() => {
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        }, 100);
      } else if (!isAtBottom) {
        // Update unread count for messages from others when not at bottom
        setUnreadCount(prev => prev + newMessageCount);
      } else {
        // We're at the bottom, so scroll to new messages
        setTimeout(() => {
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        }, 100);
      }

      lastMessageCountRef.current = messages.length;
    }
  }, [messages.length, isAtBottom, newMessageSent, scrollToBottom]);

  // Add scroll event listener and initial position
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      // Set initial scroll position with a delay to ensure content is rendered
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }, 100);
      
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll, scrollToBottom]);

  // Initial scroll only
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
          isInitialLoadRef.current = false;
        });
      }, 100);
    }
  }, [isLoading, scrollToBottom]);

  // Handle new message sent
  useEffect(() => {
    if (newMessageSent) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }, 100);
    }
  }, [newMessageSent, scrollToBottom]);

  // Clear unread count when bottom becomes visible
  useEffect(() => {
    if (isBottomVisible && isAtBottom) {
      setUnreadCount(0);
    }
  }, [isBottomVisible, isAtBottom]);

  // Group messages by date - memoized
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: MessageType[] }[] = [];
    let currentDate = '';
    let currentGroup: MessageType[] = [];

    messages.forEach(message => {
      if (!message.replyToId) {
        const date = formatDate(message.timestamp);
        if (date !== currentDate) {
          if (currentGroup.length > 0) {
            groups.push({ date: currentDate, messages: currentGroup });
          }
          currentDate = date;
          currentGroup = [message];
        } else {
          currentGroup.push(message);
        }
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  // Create virtualizer with stable dependencies
  const virtualizer = useVirtualizer({
    count: groupedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 100, []),
    overscan: 5,
    scrollToFn: (offset, { behavior }) => {
      const element = parentRef.current;
      if (!element) return;
      
      element.scrollTop = offset;
      handleScroll();
    }
  });

  // Handle reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user?.id) return;

    // Optimistically update the UI
    setMessages((prevMessages: MessageType[]) => prevMessages.map(msg => {
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

    try {
      const token = await getToken();
      await messageService.toggleReaction({
        messageId,
        emoji,
        userId: user.id,
        channelId,
        token
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      setMessages((prevMessages: MessageType[]) => [...prevMessages]);
    }
  };

  // Create a single stable handler for thread viewing
  const handleViewThread = useCallback((message: MessageType) => {
    if (typeof setActiveThread === 'function') {
      setActiveThread(message);
    } else {
      console.warn('ChatMessages: setActiveThread is not available');
    }
  }, [setActiveThread]);

  // Log when component mounts
  useEffect(() => {
    // Remove console logs
  }, [setActiveThread]);

  // Memoize the message renderer with stable dependencies
  const renderMessage = useCallback((message: MessageType, index: number, groupMessages: MessageType[]) => {
    const replies = messages.filter(m => m.replyToId === message.id);
    
    return (
      <Message
        key={`${message.id}-${index}`}
        message={message}
        onReplyClick={onReplyClick}
        hasReplies={replies.length > 0}
        replies={replies}
        onReactionSelect={handleReaction}
        userId={user?.id}
        onViewThread={handleViewThread}
        prevMessage={index > 0 ? groupMessages[index - 1] : undefined}
      />
    );
  }, [onReplyClick, handleReaction, user?.id, messages, handleViewThread]);

  if (isLoading) {
    return (
      <div className="flex-1 min-h-0 bg-gray-900">
        <div className="h-full p-4 overflow-y-auto">
          <div className="text-gray-400">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-gray-900 flex flex-col">
      {!isBottomVisible && unreadCount > 0 && (
        <div className="bg-indigo-600 text-white py-2 px-4 flex items-center justify-between shrink-0">
          <div 
            className="cursor-pointer hover:underline"
            onClick={scrollToBottom}
          >
            {unreadCount} new message{unreadCount === 1 ? '' : 's'}
          </div>
          <button 
            className="text-white/80 text-sm hover:text-white transition-colors"
            onClick={() => setUnreadCount(0)}
          >
            Mark As Read
          </button>
        </div>
      )}
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const group = groupedMessages[virtualRow.index];
            if (!group) return null;
            
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <div className="p-4">
                  <div className="text-center mb-6">
                    <span className="text-sm text-muted-foreground px-2 py-1 rounded-md bg-muted/30">
                      {group.date}
                    </span>
                  </div>
                  
                  <div className="space-y-0">
                    {group.messages.map((message, index) => renderMessage(message, index, group.messages))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Bottom observer */}
        <div ref={bottomRef} className="absolute bottom-0 left-0 w-full h-px opacity-0 pointer-events-none" />
      </div>
    </div>
  );
};