'use client'

import { useState, useEffect, useRef } from 'react';
import { userService } from '@/src/services/userService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Move cache outside component to persist between re-renders
const profileCache: {[key: string]: {name: string, image: string, timestamp: number}} = {};
const CACHE_DURATION = 60000; // Cache for 1 minute

interface ConversationHeaderProps {
  recipientId: string;
}

export function ConversationHeader({ recipientId }: ConversationHeaderProps) {
  const [recipientName, setRecipientName] = useState('User');
  const [recipientImage, setRecipientImage] = useState('');
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const fetchRecipientInfo = async () => {
      if (!recipientId) return;

      // Check cache first
      const cached = profileCache[recipientId];
      const now = Date.now();
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        setRecipientName(cached.name);
        setRecipientImage(cached.image);
        return;
      }

      try {
        const profile = await userService.getUserProfile(recipientId);
        if (profile) {
          const name = profile.username || profile.fullName || 'User';
          const image = profile.imageUrl || '';
          
          setRecipientName(name);
          setRecipientImage(image);
          
          // Update cache
          profileCache[recipientId] = {
            name,
            image,
            timestamp: now
          };
        }
      } catch (error) {
        console.error('Error fetching recipient name:', error);
      }
    };

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set new timeout
    fetchTimeoutRef.current = setTimeout(fetchRecipientInfo, 300);

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
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