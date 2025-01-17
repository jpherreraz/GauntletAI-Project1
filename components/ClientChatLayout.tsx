'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { NavigationSidebar } from '@/components/NavigationSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { useUser } from '@clerk/nextjs'
import { cn } from "@/lib/utils"
import { useRouter, usePathname } from 'next/navigation'
import { UserProfile } from '@/src/services/userService'
import { dmListService } from '@/src/services/dmListService'
import { ThreadProvider } from '@/contexts/ThreadContext'

type ExploreView = 'none' | 'servers' | 'bots';
type ViewMode = 'channels' | 'dms' | 'explore';

export function ClientChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { colorScheme } = useTheme()
  const { user } = useUser()
  const router = useRouter()
  const pathname = usePathname() || ''
  const [currentChannel, setCurrentChannel] = useState('general')
  const [viewMode, setViewMode] = useState<ViewMode>('channels')
  const [exploreView, setExploreView] = useState<ExploreView>('none')
  const [dmUsers, setDmUsers] = useState<UserProfile[]>([])
  const [selectedDMUser, setSelectedDMUser] = useState<UserProfile | null>(null)
  const [selectedDMUserId, setSelectedDMUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!pathname) return;
    
    if (pathname.startsWith('/channels/me')) {
      setViewMode('dms');
    } else if (pathname.startsWith('/channels/global/')) {
      setViewMode('channels');
      const channelId = pathname.split('/').pop();
      if (channelId) setCurrentChannel(channelId);
    } else if (pathname.startsWith('/explore/')) {
      setViewMode('explore');
      const view = pathname.split('/').pop() as ExploreView;
      setExploreView(view || 'servers');
    }
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) return;

    const loadDMList = async () => {
      const savedDMUsers = await dmListService.getDMList(user.id);
      if (savedDMUsers.length > 0) {
        setDmUsers(savedDMUsers);
      }
    };

    loadDMList();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || dmUsers.length === 0) return;

    const saveDMList = async () => {
      try {
        const success = await dmListService.saveDMList(user.id, dmUsers);
        if (!success) {
          console.error('Failed to save DM list');
        }
      } catch (error) {
        console.error('Error saving DM list:', error);
      }
    };

    saveDMList();
  }, [user?.id, dmUsers]);

  useEffect(() => {
    const handleDMStart = (event: CustomEvent<UserProfile>) => {
      const userInfo = event.detail;
      setDmUsers(prev => {
        if (!prev.find(u => u.userId === userInfo.userId)) {
          return [...prev, userInfo];
        }
        return prev;
      });
      setSelectedDMUser(userInfo);
      setSelectedDMUserId(userInfo.userId);
    };

    window.addEventListener('startDM', handleDMStart as EventListener);
    return () => window.removeEventListener('startDM', handleDMStart as EventListener);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'explore') {
      setExploreView('servers');
      router.push('/explore/servers');
    } else if (mode === 'dms') {
      setExploreView('none');
      router.push('/channels/me');
    } else {
      setExploreView('none');
      router.push(`/channels/global/${currentChannel}`);
    }
  };

  const handleChannelChange = (channelName: string) => {
    setCurrentChannel(channelName);
    router.push(`/channels/global/${channelName}`);
  };

  const handleStartDM = async (userId: string) => {
    try {
      const response = await fetch(`/api/user-profile?userId=${userId}`);
      const userInfo = await response.json();
      
      if (userInfo) {
        setDmUsers(prev => {
          if (!prev.find(u => u.userId === userId)) {
            return [...prev, userInfo];
          }
          return prev;
        });
        setViewMode('dms');
        setExploreView('none');
        setSelectedDMUserId(userId);
        router.push(`/channels/me/${userId}`);
        setSelectedDMUser(userInfo);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const getExploreContent = () => {
    switch (exploreView) {
      case 'servers':
        return 'No servers yet';
      case 'bots':
        return 'No bots yet';
      default:
        return null;
    }
  };

  const getMainContent = () => {
    if (exploreView !== 'none') {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          {getExploreContent()}
        </div>
      );
    }

    if (viewMode === 'dms' && pathname === '/channels/me') {
      return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a user to start messaging
        </div>
      );
    }

    return children;
  };

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden">
      <NavigationSidebar
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />
      <Sidebar
        currentChannel={currentChannel}
        onChannelChange={handleChannelChange}
        username={user?.firstName || 'Anonymous'}
        viewMode={viewMode}
        onServerClick={() => setExploreView('servers')}
        onBotClick={() => setExploreView('bots')}
        exploreView={exploreView}
        dmUsers={dmUsers}
        onStartDM={handleStartDM}
        selectedDMUserId={selectedDMUserId || ''}
        onDMListChange={setDmUsers}
      />
      <main className="flex-1 relative overflow-hidden">
        <ThreadProvider>
          <div className="absolute inset-0">
            {children}
          </div>
        </ThreadProvider>
      </main>
    </div>
  );
} 