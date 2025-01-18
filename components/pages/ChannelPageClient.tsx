'use client';

import ChatLayout from '@/components/chat/ChatLayout';
import { useMessages } from '@/src/hooks/useMessages';

interface ChannelPageClientProps {
  channelId: string;
}

export default function ChannelPageClient({ channelId }: ChannelPageClientProps) {
  const { messages, isLoading, sendMessage, setMessages } = useMessages(channelId);

  return (
    <div className="absolute inset-0">
      <ChatLayout
        messages={messages}
        loading={isLoading}
        onSendMessage={sendMessage}
        setMessages={setMessages}
        channelId={channelId}
      />
    </div>
  );
} 