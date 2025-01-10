'use client'

import { MessageBox } from '@/components/MessageBox'
import { useParams } from 'next/navigation'

export default function ChannelPage() {
  const params = useParams()
  if (!params?.channelId) return null;
  
  const channelId = params.channelId as string

  return (
    <div className="flex-1">
      <MessageBox channel={channelId} />
    </div>
  )
} 