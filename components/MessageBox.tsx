import { FC, useState, useEffect, useCallback } from 'react';
import { messageService } from '@/src/services/messageService';
import { Message } from '@/src/types/message';
import { ChatHeader } from './chat/ChatHeader';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
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
  const [newMessageSent, setNewMessageSent] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
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

  const handleSendMessage = async (text: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setNewMessageSent(true);

      await messageService.sendMessage({
        channelId: channel,
        text,
        fullName: user.fullName || 'Anonymous',
        replyToId: replyTo?.id,
        replyTo: replyTo ? {
          id: replyTo.id,
          text: replyTo.text,
          fullName: replyTo.fullName
        } : undefined
      });

      setReplyTo(null);
      await fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setNewMessageSent(false), 100);
    }
  };

  const handleReplyClick = (message: Message) => {
    console.log('Reply clicked:', message);
    setReplyTo(message);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        channel={channel} 
        isDM={isDM}
        recipientName={recipientName}
        recipientId={recipientId}
      />
      <ChatMessages 
        messages={messages} 
        isLoading={isLoading} 
        newMessageSent={newMessageSent}
        onReplyClick={handleReplyClick}
        setMessages={setMessages}
        channelId={channel}
      />
      <ChatInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

