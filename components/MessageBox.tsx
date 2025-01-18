import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { messageService } from '@/src/services/messageService';
import { Message } from '@/src/types/message';
import { ChatHeader } from './chat/ChatHeader';
import ChatLayout from './chat/ChatLayout';
import { useUser } from '@clerk/nextjs';
import { dmListService } from '@/src/services/dmListService';
import { SignInButton } from "@clerk/nextjs";
import { useAuth } from '@clerk/nextjs';

interface MessageBoxProps {
  channel: string;
  isDM?: boolean;
  recipientName?: string;
  recipientId?: string;
  recipientImage?: string;
}

export const MessageBox: FC<MessageBoxProps> = ({ 
  channel, 
  isDM = false, 
  recipientName,
  recipientId,
  recipientImage
}) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const token = await getToken();
      const fetchedMessages = await messageService.getMessages(channel, token);
      setMessages(fetchedMessages);
      setError(null);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [channel, getToken]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMessages([]); // Reset messages when channel changes
    setError(null);
    
    const initializeMessages = async () => {
      if (!mounted) return;
      await fetchMessages();
      // Start polling after initial fetch
      if (mounted) {
        intervalRef.current = setInterval(fetchMessages, 5000);
      }
    };

    initializeMessages();

    return () => {
      mounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [channel, fetchMessages]);

  const handleSendMessage = async (text: string) => {
    if (!isLoaded) {
      setError('Loading user data...');
      return;
    }

    if (!isSignedIn || !user) {
      setError('Please sign in to send messages');
      return;
    }

    try {
      const token = await getToken();
      const message = await messageService.sendMessage({
        channelId: channel,
        text,
        fullName: `${user.firstName} ${user.lastName}`,
        userId: user.id,
        imageUrl: user.imageUrl,
        username: user.username || undefined,
        token
      });

      setMessages(prev => [...prev, message]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p>Please sign in to view messages</p>
        <SignInButton />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <ChatLayout
        messages={messages}
        loading={loading}
        error={error}
        onSendMessage={handleSendMessage}
        channelId={channel}
        setMessages={setMessages}
        isDM={isDM}
        recipientName={recipientName}
        recipientId={recipientId}
        recipientImage={recipientImage}
      />
      <div ref={messagesEndRef} />
    </div>
  );
};

