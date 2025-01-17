'use client';

import { FC, useEffect } from 'react';
import { Message as MessageType } from '@/src/types/message';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThreadViewProps {
  parentMessage: MessageType;
  replies: MessageType[];
  onClose: () => void;
  onSendReply: (text: string) => void;
  onReactionSelect?: (messageId: string, emoji: string) => void;
  userId?: string;
}

export const ThreadView: FC<ThreadViewProps> = ({
  parentMessage,
  replies,
  onClose,
  onSendReply,
  onReactionSelect,
  userId
}) => {
  console.log('ThreadView: Rendering with props:', {
    parentMessage: {
      id: parentMessage.id,
      text: parentMessage.text.slice(0, 50) + '...',
    },
    repliesCount: replies.length,
    userId
  });

  useEffect(() => {
    console.log('ThreadView: mounted with:', {
      parentMessageId: parentMessage.id,
      parentMessageText: parentMessage.text?.slice(0, 50),
      replyCount: replies.length
    });
    return () => console.log('ThreadView: unmounting');
  }, []);

  useEffect(() => {
    console.log('ThreadView: replies updated:', {
      parentMessageId: parentMessage.id,
      replyCount: replies.length
    });
  }, [replies]);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Thread Header */}
      <div className="border-b border-gray-800 p-4 bg-gray-900 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-100">Thread</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => {
            console.log('ThreadView: close button clicked');
            onClose();
          }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Thread Messages */}
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <div className="mb-4">
          <Message message={parentMessage} onViewThread={() => {}} />
          <div className="mt-2 ml-4 flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-800"></div>
            <span className="text-xs text-gray-400">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
            <div className="h-px flex-1 bg-gray-800"></div>
          </div>
        </div>
        <div>
          {replies.map((reply, index) => (
            <Message 
              key={reply.id} 
              message={reply} 
              onViewThread={() => {}} 
              prevMessage={index > 0 ? replies[index - 1] : undefined}
            />
          ))}
        </div>
      </div>

      {/* Thread Input */}
      <div className="shrink-0">
        <ChatInput
          onSendMessage={onSendReply}
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
}; 