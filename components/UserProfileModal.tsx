'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { userService } from '@/src/services/userService'

type Status = 'online' | 'idle' | 'dnd' | 'invisible'

const statusColors: Record<Status, string> = {
  online: 'bg-green-500',
  idle: 'bg-orange-500',
  dnd: 'bg-red-500',
  invisible: 'bg-gray-500'
}

const statusText: Record<Status, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  invisible: 'Invisible'
}

const displayStatusText: Record<Status, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  invisible: 'Offline'
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  status: Status
  onStatusChange: (status: Status) => void
  userId: string
  username: string | undefined
  imageUrl?: string
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  status, 
  onStatusChange,
  userId,
  username = 'Anonymous',
  imageUrl
}: UserProfileModalProps) {
  const [bio, setBio] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load user profile when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserProfile();
    }
  }, [isOpen]);

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile(userId);
      if (profile) {
        setBio(profile.bio || "");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!userId) {
        console.error('Missing userId');
        return;
      }
      
      // Make sure we have a valid username, using fallbacks if needed
      const validUsername = username.trim() || 'Anonymous';

      const profileData = {
        userId,
        username: validUsername,
        status: status as UserProfile['status'],
        bio: bio || undefined,
        imageUrl: imageUrl || undefined
      };

      console.log('Sending profile data:', profileData);

      const success = await userService.updateUserProfile(profileData);
      
      if (success) {
        onClose();
      } else {
        console.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    console.log('UserProfileModal props:', {
      userId,
      username,
      status,
      imageUrl
    });
  }, [userId, username, status, imageUrl]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your status and bio here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imageUrl} alt={username} />
              <AvatarFallback>{username[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: Status) => onStatusChange(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusText).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center">
                      <div className={`mr-2 h-2 w-2 rounded-full ${statusColors[key as Status]}`} />
                      {value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bio" className="text-right">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="col-span-3"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

