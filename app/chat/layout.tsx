'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@clerk/nextjs'
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams } from 'next/navigation'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { colorScheme } = useTheme()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentChannel, setCurrentChannel] = useState(searchParams.get('channel') || 'general')

  useEffect(() => {
    const channel = searchParams.get('channel') || 'general'
    setCurrentChannel(channel)
  }, [searchParams])

  const handleChannelChange = (channelName: string) => {
    setCurrentChannel(channelName);
    router.push(`/chat?channel=${channelName}`);
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
        {children}
      </div>
    </div>
  )
} 