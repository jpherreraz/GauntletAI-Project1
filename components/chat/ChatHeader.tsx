import { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatHeaderProps {
  channel: string;
  isDM?: boolean;
  recipientName?: string;
  recipientId?: string;
}

export const ChatHeader: FC<ChatHeaderProps> = ({ 
  channel, 
  isDM = false, 
  recipientName = 'User',
  recipientId 
}) => {
  if (isDM) {
    return (
      <div className="flex items-center p-4 border-b border-gray-800 bg-gray-900">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src="" />
          <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-gray-100">{recipientName}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-800 p-4 bg-gray-900">
      <h2 className="text-xl font-semibold text-gray-100">
        # {channel}
      </h2>
    </div>
  );
}; 