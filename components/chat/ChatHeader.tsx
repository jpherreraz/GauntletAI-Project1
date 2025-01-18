import { FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatHeaderProps {
  channel: string;
  isDM?: boolean;
  recipientName?: string;
  recipientId?: string;
  recipientImage?: string;
}

const CHATGENIUS_BOT = {
  name: 'ChatGenius Bot',
  imageUrl: '/favicon.ico'
};

export const ChatHeader: FC<ChatHeaderProps> = ({ 
  channel, 
  isDM = false, 
  recipientName = 'User',
  recipientId,
  recipientImage
}) => {
  if (isDM) {
    const isBot = recipientId === 'chatgenius-bot';
    const displayName = isBot ? CHATGENIUS_BOT.name : recipientName;
    const avatarUrl = isBot ? CHATGENIUS_BOT.imageUrl : recipientImage;
    const initial = displayName[0]?.toUpperCase() || '?';

    return (
      <div className="flex items-center p-4 border-b border-gray-800 bg-gray-900">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-gray-100">{displayName}</span>
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