import { useState, useEffect } from 'react';
import { Message } from '@/src/types/message';
import { messageService } from '@/src/services/messageService';
import { useUser } from '@clerk/nextjs';

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const loadedMessages = await messageService.getMessages(channelId);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [channelId]);

  const sendMessage = async (text: string) => {
    if (!user) return;
    
    try {
      const newMessage = await messageService.sendMessage({
        text,
        channelId,
        fullName: user.fullName || 'Unknown User',
        userId: user.id,
        imageUrl: user.imageUrl || ''
      });
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return {
    messages,
    setMessages,
    isLoading,
    sendMessage
  };
} 