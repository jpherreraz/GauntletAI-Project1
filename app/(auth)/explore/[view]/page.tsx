'use client'

import { useParams } from 'next/navigation'

export default function ExplorePage() {
  const params = useParams()
  if (!params?.view) return null;
  
  const view = params.view as string

  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      {view === 'servers' ? 'No servers yet' : 'No bots yet'}
    </div>
  )
} 