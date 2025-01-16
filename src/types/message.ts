export interface Message {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: number;
  fullName: string;
  imageUrl?: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    text: string;
    fullName: string;
  };
  reactions?: {
    [emoji: string]: string[];
  };
} 