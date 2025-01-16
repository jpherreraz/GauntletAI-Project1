'use client'

import { useState, useEffect } from 'react';
import { userService } from '@/src/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ConversationHeaderProps {
  recipientId: string;
}

export function ConversationHeader({ recipientId }: ConversationHeaderProps) {
  const [recipientName, setRecipientName] = useState('User');
  const [recipientImage, setRecipientImage] = useState('');

  useEffect(() => {
    const fetchRecipientInfo = async () => {
      if (!recipientId) return;

      try {
        const profile = await userService.getUserProfile(recipientId);
        if (profile) {
          setRecipientName(profile.username || profile.fullName || 'User');
          setRecipientImage(profile.imageUrl || '');
        }
      } catch (error) {
        console.error('Error fetching recipient name:', error);
      }
    };

    fetchRecipientInfo();
  }, [recipientId]);

  return (
    <div className="flex items-center p-4 border-b">
      <Avatar className="h-8 w-8 mr-2">
        <AvatarImage src={recipientImage} />
        <AvatarFallback>{recipientName[0]?.toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="font-semibold">{recipientName}</span>
    </div>
  );
} 