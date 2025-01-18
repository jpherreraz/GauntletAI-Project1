import { useState, useEffect } from 'react';
import { Message } from '@/src/types/message';
import { messageService } from '@/src/services/messageService';
import { useUser, useAuth } from '@clerk/nextjs';

export function useMessages(channelId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const loadedMessages = await messageService.getMessages(channelId, token);
        setMessages(loadedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [channelId, getToken]);

  const sendMessage = async (text: string) => {
    if (!user) return;
    
    try {
      const token = await getToken();
      const newMessage = await messageService.sendMessage({
        text,
        channelId,
        fullName: user.fullName || 'Unknown User',
        userId: user.id,
        imageUrl: user.imageUrl || '',
        username: user.username || undefined,
        status: (user.unsafeMetadata.status as Message['status']) || 'online',
        bio: user.unsafeMetadata.bio as string || undefined,
        token
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