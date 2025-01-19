'use client'

import { useParams } from 'next/navigation'
import { BotBrowser } from '@/components/explore/BotBrowser'

export default function ExplorePage() {
  const params = useParams()
  if (!params?.view) return null;
  
  const view = params.view as string

  return (
    <div className="flex-1 h-full bg-gray-900">
      {view === 'servers' ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No servers yet
        </div>
      ) : view === 'bots' ? (
        <BotBrowser />
      ) : null}
    </div>
  )
} 