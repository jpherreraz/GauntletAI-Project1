import { DirectMessageBox } from '@/components/DirectMessageBox';

interface PageProps {
  params: { userId: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function UserDMPage({ params }: PageProps) {
  return (
    <div className="flex flex-col flex-1">
      <DirectMessageBox recipientId={params.userId} />
    </div>
  );
} 