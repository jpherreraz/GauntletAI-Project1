import { FC, useEffect, useRef, useState } from 'react';
import { Message as MessageType } from '@/src/types/message';
import { Message } from './Message';
import { useUser } from '@clerk/nextjs';
import { messageService } from '@/src/services/messageService';
import { formatDate } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ChatMessagesProps {
  messages: MessageType[];
  isLoading: boolean;
  newMessageSent?: boolean;
  onReplyClick?: (message: MessageType) => void;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);

  // Group messages by date
  const groupedMessages = messages.reduce<{ date: string; messages: MessageType[] }[]>((groups, message) => {
    const date = formatDate(message.timestamp);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(message);
    } else {
      groups.push({ date, messages: [message] });
    }

    return groups;
  }, []);

  // Handle initial load scroll
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0 && scrollAreaRef.current) {
      const { scrollHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTop = scrollHeight;
      isInitialLoadRef.current = false;
    }
  }, [messages]);

  // Handle message updates and new messages
  useEffect(() => {
    // Always scroll to bottom when user sends a new message
    if (newMessageSent && scrollAreaRef.current) {
      const { scrollHeight } = scrollAreaRef.current;
      scrollAreaRef.current.scrollTop = scrollHeight;
      return;
    }

    // Auto-scroll only if user is near bottom and receiving new messages
    if (scrollAreaRef.current && messages.length > lastMessageCountRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = scrollAreaRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom) {
        scrollAreaRef.current.scrollTop = scrollHeight;
      }
    }
    
    lastMessageCountRef.current = messages.length;
  }, [messages, newMessageSent]);

  // Reset initial load flag when channel changes
  useEffect(() => {
    isInitialLoadRef.current = true;
  }, [messages.length === 0]); // Reset when messages are cleared (channel change)

  const toggleThread = (messageId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Group replies with their parent messages
  const organizeMessages = (messages: MessageType[]) => {
    const messageMap = new Map<string, MessageType>();
    const repliesMap = new Map<string, MessageType[]>();

    messages.forEach(message => {
      messageMap.set(message.id, message);
      if (!repliesMap.has(message.id)) {
        repliesMap.set(message.id, []);
      }
    });

    messages.forEach(message => {
      if (message.replyToId) {
        const replies = repliesMap.get(message.replyToId) || [];
        replies.push(message);
        repliesMap.set(message.replyToId, replies.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    return messages
      .filter(message => !message.replyToId)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(message => ({
        message,
        replies: repliesMap.get(message.id) || []
      }));
  };

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
        channelId: messages.find(m => m.id === messageId)?.channelId || ''
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      setMessages((prevMessages: MessageType[]) => [...prevMessages]);
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: groupedMessages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimate average height of a message group
    overscan: 5 // Number of items to render outside of view
  });

  // Update lastMessageTimestamp when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const maxTimestamp = Math.max(...messages.map(m => m.timestamp));
      setLastMessageTimestamp(maxTimestamp);
    }
  }, [messages]);

  // Polling effect
  useEffect(() => {
    if (!channelId) return;

    const fetchNewMessages = async () => {
      try {
        if (lastMessageTimestamp > 0) {
          const newMessages = await messageService.getMessagesSince(channelId, lastMessageTimestamp);
          if (newMessages.length > 0) {
            setMessages((prev: MessageType[]) => {
              const merged = [...prev];
              newMessages.forEach(newMsg => {
                const index = merged.findIndex(m => m.id === newMsg.id);
                if (index === -1) {
                  merged.push(newMsg);
                } else {
                  merged[index] = newMsg;
                }
              });
              return merged.sort((a, b) => a.timestamp - b.timestamp);
            });
          }
        }
      } catch (error) {
        console.error('Error fetching new messages:', error);
      }
    };

    const interval = setInterval(fetchNewMessages, 1000);
    return () => clearInterval(interval);
  }, [channelId, lastMessageTimestamp, setMessages]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] overflow-hidden bg-gray-900">
        <div className="h-full p-4 overflow-y-auto">
          <div className="text-gray-400">Loading messages...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden bg-gray-900">
      <div 
        ref={parentRef}
        className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900"
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
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
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
                    {group.messages.map((message, messageIndex) => (
                      <Message
                        key={message.id}
                        message={message}
                        onReplyClick={onReplyClick}
                        hasReplies={messages.filter(m => m.replyToId === message.id).length > 0}
                        isExpanded={expandedThreads.has(message.id)}
                        onToggleReplies={() => toggleThread(message.id)}
                        replies={messages.filter(m => m.replyToId === message.id)}
                        prevMessage={messageIndex > 0 ? group.messages[messageIndex - 1] : undefined}
                        onReactionSelect={handleReaction}
                        userId={user?.id}
                      />
                    ))}
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