import { Metadata } from 'next';
import { DirectMessageBox } from '@/components/DirectMessageBox';

export const metadata: Metadata = {
  title: 'Direct Message',
  description: 'Chat directly with another user'
};

type DMParams = Promise<{ userId: string }>;

export default async function DMPage({
  params,
}: {
  params: DMParams
}) {
  const { userId } = await params;

  return (
    <div>
      <DirectMessageBox recipientId={userId} />
    </div>
  );
} 