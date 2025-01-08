import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
}

export function UserProfileModal({ isOpen, onClose, status, onStatusChange }: UserProfileModalProps) {
  const [bio, setBio] = useState("")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Status</DialogTitle>
          <DialogDescription>
            Update your status and bio here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23808080'%3E%3Crect width='24' height='24' fill='%23d1d5db'/%3E%3Cpath d='M12 11.796C14.7189 11.796 16.9231 9.60308 16.9231 6.89801C16.9231 4.19294 14.7189 2 12 2C9.28106 2 7.07692 4.19294 7.07692 6.89801C7.07692 9.60308 9.28106 11.796 12 11.796Z' fill='%239ca3af'/%3E%3Cpath d='M12 13.9011C8.46154 13.9011 2 15.6678 2 19.1678V22H22V19.1678C22 15.6678 15.5385 13.9011 12 13.9011Z' fill='%239ca3af'/%3E%3C/svg%3E" alt="User Avatar" />
              <AvatarFallback>U</AvatarFallback>
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
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

