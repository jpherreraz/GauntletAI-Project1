'use client'

import { MessageBox } from './MessageBox'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { UserProfile } from '@/src/services/userService'

interface DirectMessageBoxProps {
  recipientId: string;
}

export function DirectMessageBox({ recipientId }: DirectMessageBoxProps) {
  const { user } = useUser();
  const [recipient, setRecipient] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await fetch(`/api/user-profile?userId=${recipientId}`);
        const userInfo = await response.json();
        if (userInfo) {
          setRecipient(userInfo);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };

    loadUserInfo();
  }, [recipientId]);

  if (!user || !recipient) return null;

  const channelId = `dm-${[user.id, recipientId].sort().join('-')}`;

  return (
    <div className="flex-1 flex flex-col h-full">
      <MessageBox 
        channel={channelId} 
        isDM={true} 
        recipientName={recipient.fullName}
        recipientId={recipientId}
      />
    </div>
  );
} 