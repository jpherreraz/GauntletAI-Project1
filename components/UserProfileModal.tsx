'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  status: string
  onStatusChange: (status: string) => void
  userId: string
  imageUrl?: string
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

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  status, 
  onStatusChange,
  userId,
  imageUrl
}: UserProfileModalProps) {
  const { user } = useUser()
  const [bio, setBio] = useState(user?.unsafeMetadata.bio as string || '')
  const displayName = user?.fullName || 'Anonymous'

  // Auto-save bio when it changes
  useEffect(() => {
    const saveBio = async () => {
      try {
        await user?.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            bio
          }
        });
      } catch (error) {
        console.error('Error saving bio:', error);
      }
    };

    const timeoutId = setTimeout(saveBio, 500);
    return () => clearTimeout(timeoutId);
  }, [bio, user]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>My Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={imageUrl} />
                <AvatarFallback>{displayName[0]}</AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                statusColors[status as keyof typeof statusColors]
              )} />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {displayName}
            </h3>
          </div>
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="online">
                <div className="flex items-center">
                  <div className={cn("w-2 h-2 rounded-full mr-2", statusColors.online)} />
                  {statusText.online}
                </div>
              </SelectItem>
              <SelectItem value="idle">
                <div className="flex items-center">
                  <div className={cn("w-2 h-2 rounded-full mr-2", statusColors.idle)} />
                  {statusText.idle}
                </div>
              </SelectItem>
              <SelectItem value="dnd">
                <div className="flex items-center">
                  <div className={cn("w-2 h-2 rounded-full mr-2", statusColors.dnd)} />
                  {statusText.dnd}
                </div>
              </SelectItem>
              <SelectItem value="invisible">
                <div className="flex items-center">
                  <div className={cn("w-2 h-2 rounded-full mr-2", statusColors.invisible)} />
                  {statusText.invisible}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="resize-none"
            rows={4}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

