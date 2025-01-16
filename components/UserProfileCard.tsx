'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UserProfile, UserStatus } from '@/src/services/userService'
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
  const [status] = useState<UserStatus>(user.status || 'online')
  const [bio] = useState<string>(user.bio || '')
  const router = useRouter()

  const handleStartDM = () => {
    onClose();

    const userInfo: UserProfile = {
      userId: user.userId,
      fullName: user.fullName,
      username: user.username,
      imageUrl: user.imageUrl,
      status: user.status,
      bio: user.bio
    };

    router.push(`/channels/me/${user.userId}`);
    window.dispatchEvent(new CustomEvent('startDM', { detail: userInfo }));
  };

  const displayName = user.username || user.fullName;
  const userInitial = displayName[0].toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            View and interact with {displayName}'s profile
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.imageUrl} alt={displayName} />
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background",
                statusColors[status]
              )} />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              {displayName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {statusText[status]}
            </p>
          </div>
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleStartDM}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>
          {bio && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{bio}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 