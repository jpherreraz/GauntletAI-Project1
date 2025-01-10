import { ClientChatLayout } from '@/components/ClientChatLayout'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientChatLayout>{children}</ClientChatLayout>;
} 