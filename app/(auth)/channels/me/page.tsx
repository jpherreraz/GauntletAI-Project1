import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { UserProfile } from '@/src/services/userService';

const dynamoDb = new DynamoDBClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_DM_LISTS || "user-dm-lists";

const CHATGENIUS_BOT: Required<UserProfile> = {
  userId: 'chatgenius-bot',
  fullName: 'ChatGenius Bot',
  username: 'ChatGenius',
  imageUrl: '/favicon.ico',
  status: 'online',
  bio: 'Your AI assistant for all your questions and needs.',
  lastMessageAt: Date.now()
};

export const metadata: Metadata = {
  title: 'Direct Messages',
  description: 'Your direct message conversations'
};

async function getDMList(userId: string): Promise<UserProfile[]> {
  try {
    // Get current DM list
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: {
        userId: { S: userId }
      }
    });

    const response = await dynamoDb.send(getCommand);
    let dmUsers: UserProfile[] = [];

    if (response.Item) {
      // User has existing DM list
      const currentData = unmarshall(response.Item);
      dmUsers = currentData.dmUsers || [];
    }

    // Ensure bot is present
    if (!dmUsers.some(user => user.userId === CHATGENIUS_BOT.userId)) {
      dmUsers.unshift({
        ...CHATGENIUS_BOT,
        lastMessageAt: Date.now()
      });
    }

    console.log('DM list order:', dmUsers.map(u => ({
      id: u.userId,
      time: u.lastMessageAt,
      fullName: u.fullName
    })));

    return dmUsers;
  } catch (error) {
    console.error('Error getting DM list:', error);
    return [CHATGENIUS_BOT]; // Always return at least the bot
  }
}

export default async function DMPage() {
  const authData = await auth();
  const userId = authData.userId;
  
  if (!userId) {
    return redirect('/sign-in');
  }

  try {
    // Get the user's DM list
    const dmUsers = await getDMList(userId);
    console.log('DM page - Got DM list:', { 
      userCount: dmUsers.length,
      firstUserId: dmUsers[0]?.userId
    });

    // If there are DMs, redirect to the most recent one
    if (dmUsers.length > 0) {
      return redirect(`/channels/me/${dmUsers[0].userId}`);
    }

    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a user to start messaging
      </div>
    );
  } catch (error) {
    console.error('Error in DM page:', error);
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Error loading DM list. Please try again.
      </div>
    );
  }
} 