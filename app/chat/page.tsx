'use client'

import { Sidebar } from '@/components/Sidebar'
import { MessageBox } from '@/components/MessageBox'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from "@/lib/utils"
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function ChatPage() {
  const { colorScheme } = useTheme()
  const { user } = useUser()
  const [currentChannel, setCurrentChannel] = useState('general')

  const handleChannelChange = (channelName: string) => {
    setCurrentChannel(channelName);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen">
      <Sidebar 
        currentChannel={currentChannel}
        onChannelChange={handleChannelChange}
        username={user.fullName || user.username || 'Anonymous'}
      />
      <div className="flex-1 flex flex-col">
        <div className={cn(
          "h-12 border-b flex items-center px-4 font-medium",
          `bg-${colorScheme}-950 border-${colorScheme}-800`
        )}>
          # {currentChannel}
        </div>
        <MessageBox channel={currentChannel} />
      </div>
    </div>
  )
} 