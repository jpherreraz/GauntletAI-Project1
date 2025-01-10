'use client'

import { MessageSquare, Compass, Plus, Globe } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from './ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavigationSidebarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function NavigationSidebar({ viewMode, onViewModeChange }: NavigationSidebarProps) {
  const { colorScheme } = useTheme()

  const NavButton = ({ icon: Icon, tooltip, onClick, isActive }: { 
    icon: React.ElementType;
    tooltip: string;
    onClick?: () => void;
    isActive?: boolean;
  }) => (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            className={cn(
              "h-12 w-12 rounded-full",
              `bg-${colorScheme}-600 bg-opacity-25`,
              `hover:bg-${colorScheme}-600 hover:bg-opacity-35`,
              "transition-all duration-200",
              "hover:scale-110",
              isActive && `bg-${colorScheme}-600 bg-opacity-40`
            )}
          >
            <Icon className={cn(
              "h-5 w-5",
              `text-${colorScheme}-50`
            )} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="ml-2">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className={cn(
      "flex flex-col items-center w-[72px] h-full py-3 space-y-4",
      `bg-${colorScheme}-600 bg-opacity-25`,
      `border-r border-${colorScheme}-800`
    )}>
      <NavButton 
        icon={MessageSquare} 
        tooltip="Direct Messages" 
        onClick={() => onViewModeChange('dms')}
        isActive={viewMode === 'dms'}
      />
      <NavButton 
        icon={Compass} 
        tooltip="Explore" 
        onClick={() => onViewModeChange('explore')}
        isActive={viewMode === 'explore'}
      />
      <NavButton 
        icon={Globe} 
        tooltip="Global Chat" 
        onClick={() => onViewModeChange('channels')}
        isActive={viewMode === 'channels'}
      />
      <NavButton 
        icon={Plus} 
        tooltip="Create" 
      />
    </div>
  )
} 