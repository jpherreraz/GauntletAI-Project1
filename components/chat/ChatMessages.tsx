import { FC, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Message as MessageType } from '@/src/types/message';
import { Message } from './Message';
import { useUser } from '@clerk/nextjs';
import { messageService } from '@/src/services/messageService';
import { formatDate } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useThread } from '@/contexts/ThreadContext';

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
  const { setActiveThread } = useThread();
  const parentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Track scroll position
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const scrolledToBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    setIsAtBottom(scrolledToBottom);
    
    if (scrolledToBottom) {
      setUnreadCount(0);
    }
  }, []);

  // Watch for new messages
  useEffect(() => {
    if (!isAtBottom && messages.length > lastMessageCountRef.current && !newMessageSent) {
      setUnreadCount(prev => prev + (messages.length - lastMessageCountRef.current));
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isAtBottom, newMessageSent]);

  // Add scroll event listener
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Group messages by date - memoized
  const groupedMessages = useMemo(() => {
    console.log('ChatMessages: grouping messages, length:', messages.length);
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
    overscan: 3,
    initialRect: { width: 0, height: 0 },
    initialOffset: Number.MAX_SAFE_INTEGER // Start at bottom
  });

  // Scroll to bottom on initial load and new messages
  const scrollToBottom = useCallback(() => {
    if (groupedMessages.length > 0) {
      virtualizer.scrollToIndex(groupedMessages.length - 1, { align: 'end', behavior: 'auto' });
    }
  }, [virtualizer, groupedMessages.length]);

  // Initial scroll
  useEffect(() => {
    if (groupedMessages.length > 0 && !isLoading) {
      // Try immediately
      scrollToBottom();
      // And after a short delay to ensure content is rendered
      const timer = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timer);
    }
  }, [groupedMessages.length, isLoading, scrollToBottom]);

  // Scroll only when user sends a new message
  useEffect(() => {
    if (newMessageSent) {
      scrollToBottom();
    }
  }, [newMessageSent, scrollToBottom]);

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
      await messageService.toggleReaction({
        messageId,
        emoji,
        userId: user.id,
        channelId
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      setMessages((prevMessages: MessageType[]) => [...prevMessages]);
    }
  };

  // Create a single stable handler for thread viewing
  const handleViewThread = useCallback((message: MessageType) => {
    console.log('ChatMessages: handleViewThread called with:', {
      messageId: message.id,
      hasSetActiveThread: typeof setActiveThread === 'function'
    });

    if (typeof setActiveThread === 'function') {
      console.log('ChatMessages: setting active thread');
      setActiveThread(message);
    } else {
      console.warn('ChatMessages: setActiveThread is not available');
    }
  }, [setActiveThread]);

  // Log when component mounts
  useEffect(() => {
    console.log('ChatMessages: mounted with thread context:', {
      hasSetActiveThread: typeof setActiveThread === 'function'
    });
  }, [setActiveThread]);

  // Memoize the message renderer with stable dependencies
  const renderMessage = useCallback((message: MessageType, index: number, groupMessages: MessageType[]) => {
    const replies = messages.filter(m => m.replyToId === message.id);
    
    return (
      <Message
        key={message.id}
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
      {!isAtBottom && unreadCount > 0 && (
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
        className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
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
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};