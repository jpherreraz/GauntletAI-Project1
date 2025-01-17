import { FC, useState, useEffect, useCallback } from 'react';
import { messageService } from '@/src/services/messageService';
import { Message } from '@/src/types/message';
import { ChatHeader } from './chat/ChatHeader';
import ChatLayout from './chat/ChatLayout';
import { useUser } from '@clerk/nextjs';

interface MessageBoxProps {
  channel: string;
  isDM?: boolean;
  recipientName?: string;
  recipientId?: string;
}

export const MessageBox: FC<MessageBoxProps> = ({ 
  channel, 
  isDM = false, 
  recipientName,
  recipientId 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  const fetchMessages = useCallback(async () => {
    try {
      const fetchedMessages = await messageService.getMessages(channel);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSendMessage = async (text: string, parentId?: string) => {
    if (!user) return;

    try {
      // Optimistically add the message to the UI
      const optimisticMessage = {
        id: Date.now().toString(), // Temporary ID
        text,
        fullName: user.fullName || 'Anonymous',
        userId: user.id,
        channelId: channel,
        timestamp: Date.now(),
        replyToId: parentId,
        replyTo: parentId ? {
          id: parentId,
          text: messages.find(m => m.id === parentId)?.text || '',
          fullName: messages.find(m => m.id === parentId)?.fullName || ''
        } : undefined
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      await messageService.sendMessage({
        channelId: channel,
        text,
        fullName: user.fullName || 'Anonymous',
        replyToId: parentId,
        replyTo: parentId ? {
          id: parentId,
          text: messages.find(m => m.id === parentId)?.text || '',
          fullName: messages.find(m => m.id === parentId)?.fullName || ''
        } : undefined
      });

      // Quietly fetch the latest messages
      const fetchedMessages = await messageService.getMessages(channel);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        channel={channel} 
        isDM={isDM}
        recipientName={recipientName}
        recipientId={recipientId}
      />
      <ChatLayout
        messages={messages}
        loading={isLoading}
        onSendMessage={handleSendMessage}
        channelId={channel}
        setMessages={setMessages}
        isDM={isDM}
        recipientName={recipientName}
        recipientId={recipientId}
      />
    </div>
  );
};

