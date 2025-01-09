import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Hash, User, MoreVertical, Settings, Cog } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from "@/lib/utils"
import { UserProfileModal } from './UserProfileModal'
import { SettingsMenu } from './SettingsMenu'
import { useTheme } from '@/contexts/ThemeContext'
import { getThemeClasses } from '@/lib/theme'
import { useUser } from '@clerk/nextjs'
import { Amplify } from 'aws-amplify';
import { AppSyncClient, ListGraphqlApisCommand } from "@aws-sdk/client-appsync";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { useSettings } from "@/contexts/SettingsContext"

Amplify.configure({
  region: 'us-east-2', // e.g., 'us-east-1'
  credentials: {
    accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',
    secretAccessKey: 'c2bOGkLE9ezXvtKxJmwxjxGqbXzODqrrCchY5954',
  }
});

interface Channel {
  id: string
  name: string
  type: 'channel' | 'dm'
}

type Status = 'online' | 'idle' | 'dnd' | 'invisible'

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

interface SidebarProps {
  currentChannel: string
  onChannelChange: (channelName: string) => void
  username: string
}

export function Sidebar({ 
  currentChannel, 
  onChannelChange,
  username
}: SidebarProps) {
  const { colorScheme } = useTheme()
  const { user } = useUser()
  const themeClasses = getThemeClasses(colorScheme)
  const [channels, setChannels] = useState<Channel[]>([
    { id: '1', name: 'general', type: 'channel' },
    { id: '2', name: 'random', type: 'channel' },
    { id: '3', name: 'support', type: 'channel' },
    { id: '4', name: 'You', type: 'dm' },
  ])
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('online')
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false)
  const { isOpen, setIsOpen } = useSettings();

  const handleStatusChange = useCallback((newStatus: Status) => {
    setStatus(newStatus);
  }, []);

  const handleOpenSettings = () => {
    setIsSettingsMenuOpen(true);
  };

  const handleDeleteChannel = (id: string) => {
    setChannels(channels.filter(channel => channel.id !== id))
    if (currentChannel === channels.find(c => c.id === id)?.name) {
      onChannelChange('general')
    }
  }

  const handleEditChannel = (id: string, newName: string) => {
    setChannels(channels.map(channel =>
      channel.id === id ? { ...channel, name: newName } : channel
    ))
    setEditingChannel(null)
    if (currentChannel === channels.find(c => c.id === id)?.name) {
      onChannelChange(newName)
    }
  }

  const renderChannelIcon = (channel: Channel) => {
    if (channel.type === 'channel') {
      return <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
    }
    return <User className="h-4 w-4 mr-2 flex-shrink-0" />
  }

  // const testAccess = async () => {
  //   try {
  //     const appSyncClient = new AppSyncClient(...);
  //     ...
  //   } catch (error) {
  //     ...
  //   }
  // };

  const handleChannelClick = (channelName: string) => {
    if (typeof onChannelChange === 'function') {
      onChannelChange(channelName);
    }
  };

  return (
    <>
      <div className={cn(
        "w-64 h-full flex flex-col",
        `bg-${colorScheme}-600 bg-opacity-20`,
        `text-${colorScheme}-50`
      )}>
        <ScrollArea className="flex-grow">
          <div className="p-4">
            <h3 className={cn(
              "mb-2 px-2 text-sm font-semibold",
              `text-${colorScheme}-50 text-opacity-70`
            )}>
              Channels
            </h3>
            {channels.filter(channel => channel.type === 'channel').map((channel) => (
              <div key={channel.id} className="mb-1">
                <div
                  className={cn(
                    "flex items-center w-full p-2 rounded-md cursor-pointer",
                    channel.name === currentChannel
                      ? cn(
                          `bg-${colorScheme}-600`,
                          "bg-opacity-30",
                          `text-${colorScheme}-50`
                        )
                      : cn(
                          `hover:bg-${colorScheme}-700`,
                          "hover:bg-opacity-15",
                          `text-${colorScheme}-50 text-opacity-90`
                        )
                  )}
                  onClick={() => handleChannelClick(channel.name)}
                >
                  {renderChannelIcon(channel)}
                  <span>{channel.name}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2 mt-4">
            <h3 className={cn(
              "mt-6 mb-2 px-2 text-sm font-semibold",
              `text-${colorScheme}-50 text-opacity-70`
            )}>
              Direct Messages
            </h3>
            {channels.filter(channel => channel.type === 'dm').map((channel) => (
              <div key={channel.id} className="mb-1">
                <div
                  className={cn(
                    "flex items-center w-full p-2 rounded-md cursor-pointer",
                    channel.name === currentChannel
                      ? cn(
                          `bg-${colorScheme}-600`,
                          "bg-opacity-30",
                          `text-${colorScheme}-50`
                        )
                      : cn(
                          `hover:bg-${colorScheme}-700`,
                          "hover:bg-opacity-15",
                          `text-${colorScheme}-50 text-opacity-90`
                        )
                  )}
                  onClick={() => handleChannelClick(channel.name)}
                >
                  {renderChannelIcon(channel)}
                  <span>{channel.name === username ? 'You' : channel.name}</span>
                </div>
              </div>
            ))}
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
        username={user?.username || ''}
        imageUrl={user?.imageUrl}
      />
    </>
  )
}

