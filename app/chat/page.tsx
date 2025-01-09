'use client'

import { MessageBox } from '@/components/MessageBox'
import { useSearchParams } from 'next/navigation'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const channel = searchParams.get('channel') || 'general'

  return (
    <div className="h-screen">
      <MessageBox channel={channel} />
    </div>
  )
} 