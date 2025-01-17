import { FC, useState } from 'react';
import { Reply, X, SmilePlus } from 'lucide-react';
import { Message } from '@/src/types/message';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EmojiPicker } from '@/components/EmojiPicker';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading?: boolean;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  placeholder?: string;
}

export const ChatInput: FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading,
  replyTo,
  onCancelReply,
  placeholder = "Type a message..." 
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setText(prev => prev + emoji);
  };

  return (
    <div className="p-4 bg-gray-900">
      {replyTo && (
        <div className="mb-2 p-2 bg-gray-800 rounded flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Reply className="h-3 w-3" />
            Replying to <span className="font-medium">{replyTo.fullName}</span>
          </div>
          <button 
            onClick={onCancelReply}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={placeholder}
          className="w-full bg-gray-800 text-white rounded px-4 py-2 pr-10"
          disabled={isLoading}
        />
        <div className="absolute right-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-transparent"
              >
                <SmilePlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="end" 
              className="w-80 p-0 bg-gray-800 border-gray-700"
            >
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}; 