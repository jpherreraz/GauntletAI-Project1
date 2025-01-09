'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { UserProfile } from '@/src/services/userService';
import { useState } from 'react';

interface UserProfileCardProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
}

const statusColors = {
  online: 'bg-green-500',
  idle: 'bg-orange-500',
  dnd: 'bg-red-500',
  invisible: 'bg-gray-500'
} as const

const statusText = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  invisible: 'Offline'
} as const

export function UserProfileCard({ isOpen, onClose, user }: UserProfileCardProps) {
  const [status, setStatus] = useState<string>(user.status || 'online');
  const [bio, setBio] = useState<string>(user.bio || '');

  const handleSave = async () => {
    try {
      // Make sure we have the required fields
      const profileData = {
        userId: user.userId,
        username: user.username, // This should already be present from the UserProfile
        status: status as UserProfile['status'],
        bio: bio,
        imageUrl: user.imageUrl
      };

      const success = await userService.updateUserProfile(profileData);
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.imageUrl} alt={user.username} />
                <AvatarFallback>{user.username[0]}</AvatarFallback>
              </Avatar>
              {user.status && (
                <div className={cn(
                  "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                  statusColors[user.status]
                )} />
              )}
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{user.username}</h3>
            {user.status && (
              <p className="text-sm text-muted-foreground">{statusText[user.status]}</p>
            )}
          </div>
          {user.bio && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{user.bio}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 