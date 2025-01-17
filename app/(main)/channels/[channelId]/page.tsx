'use client';

import { FC } from 'react';
import ChatLayout from '@/components/chat/ChatLayout';
import { useMessages } from '@/src/hooks/useMessages';

interface ChannelPageProps {
  params: {
    channelId: string;
  };
}

const ChannelPage: FC<ChannelPageProps> = ({ params }) => {
  const { messages, isLoading, sendMessage, setMessages } = useMessages(params.channelId);

  console.log('ChannelPage: rendering with messages:', messages.length);

  return (
    <div className="absolute inset-0">
      <ChatLayout
        messages={messages}
        loading={isLoading}
        onSendMessage={sendMessage}
        setMessages={setMessages}
        channelId={params.channelId}
      />
    </div>
  );
};

export default ChannelPage; 