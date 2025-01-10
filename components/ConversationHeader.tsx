'use client'

import { useEffect, useState } from 'react';
import { userService } from '@/src/services/userService';

interface ConversationHeaderProps {
  channelId: string;
  isDM?: boolean;
  recipientId?: string;
}

export function ConversationHeader({ channelId, isDM = false, recipientId }: ConversationHeaderProps) {
  const [recipientName, setRecipientName] = useState<string>('');

  useEffect(() => {
    if (isDM && recipientId) {
      const fetchRecipientName = async () => {
        try {
          const profile = await userService.getUserProfile(recipientId);
          if (profile) {
            setRecipientName(profile.username);
          }
        } catch (error) {
          console.error('Error fetching recipient name:', error);
          setRecipientName('User');
        }
      };

      fetchRecipientName();
    }
  }, [isDM, recipientId]);

  return (
    <div className="border-b px-6 py-3 flex items-center">
      <h2 className="text-lg font-semibold">
        {isDM ? (
          <>
            {recipientName || 'loading...'}
            {/* Debug output */}
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs text-muted-foreground ml-2">
                (ID: {recipientId})
              </span>
            )}
          </>
        ) : (
          `#${channelId}`
        )}
      </h2>
    </div>
  );
} 