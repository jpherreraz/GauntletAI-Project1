'use client';

import { useThread } from '@/contexts/ThreadContext';
import { Message as MessageType } from '@/src/types/message';
import { useEffect, useRef, useState } from 'react';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';
import { ThreadView } from './ThreadView';
import { ChatHeader } from './ChatHeader';

interface ChatLayoutProps {
  messages: MessageType[];
  loading: boolean;
  onSendMessage: (text: string, parentId?: string) => void;
  channelId: string;
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  isDM?: boolean;
  recipientName?: string;
  recipientId?: string;
}

export default function ChatLayout({ 
  messages, 
  loading, 
  onSendMessage,
  channelId,
  setMessages,
  isDM = false,
  recipientName,
  recipientId
}: ChatLayoutProps) {
  const renderCount = useRef(0);
  const { activeThread, setActiveThread } = useThread();
  const [newMessageSent, setNewMessageSent] = useState(false);

  // Close thread view when channel changes
  useEffect(() => {
    if (activeThread) {
      setActiveThread(null);
    }
  }, [channelId]);

  // Log initial mount and cleanup
  useEffect(() => {
    console.log('ChatLayout: mounted with thread context:', {
      hasActiveThread: !!activeThread,
      threadId: activeThread?.id,
      messageCount: messages.length
    });
    return () => console.log('ChatLayout: unmounting');
  }, []);

  // Log every render
  useEffect(() => {
    renderCount.current++;
    console.log('ChatLayout: rendering', {
      renderCount: renderCount.current,
      hasActiveThread: !!activeThread,
      threadId: activeThread?.id,
      messageCount: messages.length
    });
  });

  // Log thread state changes
  useEffect(() => {
    console.log('ChatLayout: thread state changed:', {
      hasActiveThread: !!activeThread,
      threadId: activeThread?.id,
      messageText: activeThread?.text?.slice(0, 50),
      threadObject: activeThread ? JSON.stringify(activeThread) : 'null'
    });
  }, [activeThread]);

  const replies = activeThread ? messages.filter(msg => msg.replyToId === activeThread.id) : [];
  console.log('ChatLayout: filtered replies:', {
    threadId: activeThread?.id,
    replyCount: replies.length,
    hasActiveThread: !!activeThread,
    mainDivWidth: activeThread ? "w-[calc(100%-400px)]" : "w-full",
    shouldShowThreadView: !!activeThread
  });

  return (
    <div className="absolute inset-0 flex">
      <div className={activeThread ? "w-[calc(100%-400px)]" : "w-full"}>
        <div className="h-full flex flex-col">
          <ChatHeader 
            channel={channelId}
            isDM={isDM}
            recipientName={recipientName}
            recipientId={recipientId}
          />
          <ChatMessages
            messages={messages}
            isLoading={loading}
            newMessageSent={newMessageSent}
            onReplyClick={setActiveThread}
            setMessages={setMessages}
            channelId={channelId}
          />
          <ChatInput 
            onSendMessage={(text: string) => {
              onSendMessage(text);
              setNewMessageSent(true);
              setTimeout(() => setNewMessageSent(false), 100);
            }} 
          />
        </div>
      </div>
      {activeThread && (
        <div className="w-[400px] h-full bg-gray-900 border-l border-gray-800 shadow-lg">
          <ThreadView
            parentMessage={activeThread}
            replies={replies}
            onClose={() => {
              console.log('ChatLayout: closing thread view');
              setActiveThread(null);
            }}
            onSendReply={(text: string) => onSendMessage(text, activeThread.id)}
          />
        </div>
      )}
    </div>
  );
} 