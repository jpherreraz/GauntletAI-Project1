'use client'

import { MessageBox } from './MessageBox'
import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { UserProfile } from '@/src/services/userService'

interface DirectMessageBoxProps {
  recipientId: string;
}

export function DirectMessageBox({ recipientId }: DirectMessageBoxProps) {
  const { user } = useUser();
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const channelId = useMemo(() => 
    user ? `dm-${[user.id, recipientId].sort().join('-')}` : null, 
    [user?.id, recipientId]
  );

  const loadUserInfo = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      const response = await fetch(`/api/user-profile?userId=${recipientId}`, {
        credentials: 'include'
      });
      
      const errorData = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(`Failed to load user info: ${errorData.error || response.statusText}`);
        return;
      }

      if (!errorData || typeof errorData !== 'object') {
        setError('Invalid user info format received');
        return;
      }
      
      setRecipient(errorData);
      setError(null);
    } catch (error) {
      setError('Failed to load user info. Please try again.');
    } finally {
      loadingRef.current = false;
    }
  }, [recipientId]);

  useEffect(() => {
    if (user && recipientId && !recipient && !loadingRef.current) {
      loadUserInfo();
    }
  }, [user, recipientId, recipient, loadUserInfo]);

  if (!user || !channelId) {
    return null;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!recipient) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <MessageBox 
        key={channelId}
        channel={channelId} 
        isDM={true} 
        recipientName={recipient.fullName}
        recipientId={recipientId}
        recipientImage={recipient.imageUrl}
      />
    </div>
  );
} 