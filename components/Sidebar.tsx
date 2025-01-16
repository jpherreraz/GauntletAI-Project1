import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Hash, User, Bot, Globe, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from "@/lib/utils"
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@clerk/nextjs'
import { UserProfile } from '@/src/services/userService'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from "@/components/ui/use-toast"
import { useSettings } from "@/contexts/SettingsContext"
import Link from 'next/link'
import { UserProfileModal } from './UserProfileModal'

interface Channel {
  id: string
  name: string
  type: 'channel' | 'dm'
}

type Status = 'online' | 'idle' | 'dnd' | 'invisible'
type ViewMode = 'channels' | 'dms' | 'explore'
type ExploreView = 'none' | 'servers' | 'bots'

interface SidebarProps {
  currentChannel: string
  onChannelChange: (channelName: string) => void
  username: string
  viewMode: ViewMode
  onServerClick: () => void
  onBotClick: () => void
  exploreView: ExploreView
  dmUsers?: UserProfile[]
  onStartDM?: (userId: string) => void
  selectedDMUserId?: string
  onDMListChange?: (dmUsers: UserProfile[]) => void
}

const statusColors: Record<Status, string> = {
  online: 'bg-green-500',
  idle: 'bg-orange-500',
  dnd: 'bg-red-500',
  invisible: 'bg-gray-500'
}

const displayStatusText: Record<Status, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do Not Disturb',
  invisible: 'Offline'
}

export function Sidebar({ 
  currentChannel, 
  onChannelChange,
  username,
  viewMode,
  onServerClick,
  onBotClick,
  exploreView,
  dmUsers = [],
  onStartDM,
  selectedDMUserId,
  onDMListChange,
}: SidebarProps) {
  const { colorScheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const { isOpen, setIsOpen } = useSettings()
  const [channels] = useState<Channel[]>([
    { id: '1', name: 'general', type: 'channel' },
    { id: '2', name: 'random', type: 'channel' },
    { id: '3', name: 'support', type: 'channel' },
  ])
  const [status, setStatus] = useState<Status>('online')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [localDmUsers, setLocalDmUsers] = useState(dmUsers)

  useEffect(() => {
    setLocalDmUsers(dmUsers)
  }, [dmUsers])

  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus as Status)
  }, [])

  const handleChannelClick = (channelName: string) => {
    if (typeof onChannelChange === 'function') {
      onChannelChange(channelName)
    }
  }

  const handleBotClick = () => {
    onBotClick()
    router.push('/explore/bots')
  }

  const handleServerClick = () => {
    onServerClick()
    router.push('/explore/servers')
  }

  const isDMSelected = (userId: string) => {
    return pathname?.includes(`/channels/me/${userId}`)
  }

  const handleDeleteDM = async (userId: string) => {
    try {
      // Update local state immediately
      const updatedUsers = localDmUsers.filter(dmUser => dmUser.userId !== userId)
      setLocalDmUsers(updatedUsers)
      
      // Update parent state immediately
      onDMListChange?.(updatedUsers)

      // Redirect if we're in the deleted DM's channel
      if (pathname?.includes(`/channels/me/${userId}`)) {
        router.push('/channels/me')
      }

      // Make the API call in the background
      const response = await fetch(`/api/dm-list/remove?userId=${user?.id}&targetId=${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Revert both local and parent state if API call fails
        setLocalDmUsers(dmUsers)
        onDMListChange?.(dmUsers)
        throw new Error('Failed to remove DM')
      }
      
      toast({
        description: "Direct message removed successfully",
      })

    } catch (error) {
      console.error('Error removing DM:', error)
      toast({
        title: "Error",
        description: "Failed to remove direct message",
        variant: "destructive"
      })
    }
  }

  const renderContent = () => {
    switch (viewMode) {
      case 'channels':
        return (
          <>
            <div className="mb-6 flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                `bg-${colorScheme}-600 bg-opacity-25`
              )}>
                <Globe className={cn(
                  "h-4 w-4",
                  `text-${colorScheme}-50`
                )} />
              </div>
              <h2 className={cn(
                "text-lg font-bold",
                `text-${colorScheme}-50`
              )}>
                Global Chat
              </h2>
            </div>
            <h3 className={cn(
              "mb-2 px-2 text-sm font-semibold",
              `text-${colorScheme}-50 text-opacity-70`
            )}>
              Channels
            </h3>
            {channels.map((channel) => (
              <div key={channel.id} className="mb-1">
                <div
                  className={cn(
                    "flex items-center w-full p-2 rounded-md cursor-pointer",
                    channel.name === currentChannel
                      ? cn(`bg-${colorScheme}-600`, "bg-opacity-30", `text-${colorScheme}-50`)
                      : cn(`hover:bg-${colorScheme}-700`, "hover:bg-opacity-15", `text-${colorScheme}-50 text-opacity-90`)
                  )}
                  onClick={() => handleChannelClick(channel.name)}
                >
                  <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{channel.name}</span>
                </div>
              </div>
            ))}
          </>
        )

      case 'explore':
        return (
          <>
            <h3 className={cn(
              "mb-2 px-2 text-sm font-semibold",
              `text-${colorScheme}-50 text-opacity-70`
            )}>
              Explore
            </h3>
            <div className="space-y-1">
              <div
                className={cn(
                  "flex items-center w-full p-2 rounded-md cursor-pointer",
                  exploreView === 'servers'
                    ? cn(`bg-${colorScheme}-600`, "bg-opacity-30", `text-${colorScheme}-50`)
                    : cn(`hover:bg-${colorScheme}-700`, "hover:bg-opacity-15", `text-${colorScheme}-50 text-opacity-90`)
                )}
                onClick={handleServerClick}
              >
                <Globe className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Servers</span>
              </div>
              <div
                className={cn(
                  "flex items-center w-full p-2 rounded-md cursor-pointer",
                  exploreView === 'bots'
                    ? cn(`bg-${colorScheme}-600`, "bg-opacity-30", `text-${colorScheme}-50`)
                    : cn(`hover:bg-${colorScheme}-700`, "hover:bg-opacity-15", `text-${colorScheme}-50 text-opacity-90`)
                )}
                onClick={handleBotClick}
              >
                <Bot className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Bots</span>
              </div>
            </div>
          </>
        )

      case 'dms':
        return (
          <>
            <h3 className={cn(
              "mb-2 px-2 text-sm font-semibold",
              `text-${colorScheme}-50 text-opacity-70`
            )}>
              Direct Messages
            </h3>
            <div className="space-y-1">
              {localDmUsers.map((dmUser) => (
                <div
                  key={dmUser.userId}
                  className="group relative flex items-center px-2 py-1.5 rounded-md hover:bg-accent/50"
                >
                  <Link
                    href={`/channels/me/${dmUser.userId}`}
                    className={cn(
                      "flex items-center gap-2 flex-1 min-w-0",
                      pathname === `/channels/me/${dmUser.userId}` && "bg-accent"
                    )}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={dmUser.imageUrl} />
                      <AvatarFallback>{dmUser.fullName?.[0] || dmUser.username?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="truncate">{dmUser.fullName || dmUser.username}</span>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteDM(dmUser.userId)
                    }}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 ml-2 hover:bg-red-500/20 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )
    }
  }

  return (
    <>
      <div className={cn(
        "w-64 h-full flex flex-col",
        `bg-${colorScheme}-600 bg-opacity-20`,
        `text-${colorScheme}-50`
      )}>
        <ScrollArea className="flex-grow">
          <div className="p-4">
            {renderContent()}
          </div>
        </ScrollArea>
        <div className="p-4 flex items-center gap-2">
          <div 
            className="flex-1 flex items-center gap-2 cursor-pointer hover:opacity-80"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <div className="relative">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>{user?.firstName?.[0] || user?.username?.[0]}</AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute bottom-0 right-0 w-3 h-3 rounded-full border border-background",
                statusColors[status]
              )} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.username}</p>
              <p className="text-xs text-muted-foreground">{displayStatusText[status]}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 group"
            onClick={() => setIsOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-6 w-6 opacity-50 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:rotate-90"
            >
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
            </svg>
            <span className="sr-only">Settings</span>
          </Button>
        </div>
      </div>
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        status={status}
        onStatusChange={handleStatusChange}
        userId={user?.id || ''}
        imageUrl={user?.imageUrl}
      />
    </>
  )
}

