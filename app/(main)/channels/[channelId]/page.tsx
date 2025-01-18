import { Metadata } from 'next';
import ChannelPageClient from '@/components/pages/ChannelPageClient';

export const metadata: Metadata = {
  title: 'Channel'
};

interface PageProps {
  params: Promise<{ channelId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChannelPage({ 
  params,
  searchParams,
}: PageProps) {
  const { channelId } = await params;
  await searchParams;
  return <ChannelPageClient channelId={channelId} />;
} 