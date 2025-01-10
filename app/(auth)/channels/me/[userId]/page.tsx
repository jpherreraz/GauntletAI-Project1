import { DirectMessageBox } from '@/components/DirectMessageBox';
import { MessageBox } from '@/components/MessageBox';

interface Props {
  params: {
    userId: string;
  }
}

export default function UserDMPage({ params }: Props) {
  return (
    <div className="flex flex-col flex-1">
      <DirectMessageBox recipientId={params.userId} />
    </div>
  );
} 