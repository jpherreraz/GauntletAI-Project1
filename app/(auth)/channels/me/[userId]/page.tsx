import { DirectMessageBox } from '@/components/DirectMessageBox';

export interface PageProps {
  params: { userId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function UserDMPage({ params }: PageProps) {
  return (
    <div className="flex flex-col flex-1">
      <DirectMessageBox recipientId={params.userId} />
    </div>
  );
} 