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
  const [lastExploreView, setLastExploreView] = useState<'servers' | 'bots'>('servers')
  const [dmUsers, setDmUsers] = useState<UserProfile[]>([])
  const [selectedDMUser, setSelectedDMUser] = useState<UserProfile | null>(null)
  const [selectedDMUserId, setSelectedDMUserId] = useState<string | null>(null)
  const [lastViewedDMUserId, setLastViewedDMUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!pathname) return;
    
    if (pathname.startsWith('/channels/me')) {
      setViewMode('dms');
      const userId = pathname.split('/').pop();
      if (userId && userId !== 'me') {
        setLastViewedDMUserId(userId);
      } else if (userId === 'me' && dmUsers.length > 0) {
        // When landing on /channels/me, redirect to most recent DM
        const mostRecentDM = dmUsers[0];
        router.push(`/channels/me/${mostRecentDM.userId}`);
        setSelectedDMUserId(mostRecentDM.userId);
        setSelectedDMUser(mostRecentDM);
        setLastViewedDMUserId(mostRecentDM.userId);
      }
    } else if (pathname.startsWith('/channels/global/')) {
      setViewMode('channels');
      const channelId = pathname.split('/').pop();
      if (channelId) setCurrentChannel(channelId);
    } else if (pathname.startsWith('/explore/')) {
      setViewMode('explore');
      const view = pathname.split('/').pop() as ExploreView;
      setExploreView(view || 'servers');
      if (view === 'servers' || view === 'bots') {
        setLastExploreView(view);
      }
    }
  }, [pathname, dmUsers, router]);

  useEffect(() => {
    if (!user?.id) return;

    const loadDMList = async () => {
      try {
        const savedDMUsers = await dmListService.getDMList(user.id);
        setDmUsers(savedDMUsers);
      } catch (error) {
        console.error('Error loading DM list:', error);
      }
    };

    // Initial load
    loadDMList();

    // Poll for updates more frequently (every 2 seconds)
    const interval = setInterval(loadDMList, 2000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    const handleDMStart = async (event: Event) => {
      const customEvent = event as CustomEvent<UserProfile>;
      const userInfo = customEvent.detail;
      if (user?.id) {
        try {
          // Let the server handle the ordering
          await dmListService.updateLastMessageTime(user.id, userInfo.userId);
          
          // Update UI state
          setViewMode('dms');
          setExploreView('none');
          setSelectedDMUserId(userInfo.userId);
          setLastViewedDMUserId(userInfo.userId);
          router.push(`/channels/me/${userInfo.userId}`);
          setSelectedDMUser(userInfo);
        } catch (error) {
          console.error('Error starting DM:', error);
        }
      }
    };

    window.addEventListener('startDM', handleDMStart);
    return () => window.removeEventListener('startDM', handleDMStart);
  }, [user?.id]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'explore') {
      setExploreView(lastExploreView);
      router.push(`/explore/${lastExploreView}`);
    } else if (mode === 'dms') {
      setExploreView('none');
      // First try to open the last viewed DM
      if (lastViewedDMUserId && dmUsers.some(user => user.userId === lastViewedDMUserId)) {
        router.push(`/channels/me/${lastViewedDMUserId}`);
        setSelectedDMUserId(lastViewedDMUserId);
        setSelectedDMUser(dmUsers.find(user => user.userId === lastViewedDMUserId) || null);
      } else if (dmUsers.length > 0) {
        // Fall back to most recent DM if last viewed is not available
        const mostRecentDM = dmUsers[0];
        router.push(`/channels/me/${mostRecentDM.userId}`);
        setSelectedDMUserId(mostRecentDM.userId);
        setSelectedDMUser(mostRecentDM);
        setLastViewedDMUserId(mostRecentDM.userId);
      } else {
        router.push('/channels/me');
      }
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
      
      if (user?.id) {
        // Update the DM list through the service
        await dmListService.updateLastMessageTime(user.id, userId);
        
        // Update UI state
        setViewMode('dms');
        setExploreView('none');
        setSelectedDMUserId(userId);
        setLastViewedDMUserId(userId);
        router.push(`/channels/me/${userId}`);
        setSelectedDMUser(userInfo);
      }
    } catch (error) {
      console.error('Error starting DM:', error);
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

  const handleDMListChange = (updatedUsers: UserProfile[]) => {
    setDmUsers(updatedUsers);
    
    // If we're in DM view and either on /channels/me or viewing a DM that was just deleted
    if (viewMode === 'dms' && (
      pathname === '/channels/me' || 
      (selectedDMUserId && !updatedUsers.some(u => u.userId === selectedDMUserId))
    )) {
      if (updatedUsers.length > 0) {
        const mostRecentDM = updatedUsers[0];
        router.push(`/channels/me/${mostRecentDM.userId}`);
        setSelectedDMUserId(mostRecentDM.userId);
        setSelectedDMUser(mostRecentDM);
        setLastViewedDMUserId(mostRecentDM.userId);
      } else {
        router.push('/channels/me');
      }
    }
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
        onDMListChange={handleDMListChange}
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