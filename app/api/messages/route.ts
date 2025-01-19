import { NextResponse, NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { dmListService } from '@/src/services/dmListService';
import { UserProfile, UserStatus } from '@/src/services/userService';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const MESSAGES_TABLE = process.env.DYNAMODB_TABLE_MESSAGES!;

type BotId = 'chatgenius-bot' | 'notes-bot' | 'gollum-bot' | 'yoda-bot';

const BOT_PROFILES: Record<BotId, Required<UserProfile>> = {
  'chatgenius-bot': {
    userId: 'chatgenius-bot',
    fullName: 'ChatGenius Bot',
    username: 'ChatGenius',
    imageUrl: '/favicon.ico',
    status: 'online' as UserStatus,
    bio: 'Your AI assistant for all your questions and needs.',
    lastMessageAt: Date.now()
  },
  'notes-bot': {
    userId: 'notes-bot',
    fullName: 'Notes Bot',
    username: 'Notes',
    imageUrl: '/notes-bot.svg',
    status: 'online' as UserStatus,
    bio: 'Keep track of your notes and important information.',
    lastMessageAt: Date.now()
  },
  'gollum-bot': {
    userId: 'gollum-bot',
    fullName: 'Gollum Bot',
    username: 'Gollum',
    imageUrl: '/gollum.jpg',
    status: 'online' as UserStatus,
    bio: 'My precious! We helps you with riddles and secrets, yes precious!',
    lastMessageAt: Date.now()
  },
  'yoda-bot': {
    userId: 'yoda-bot',
    fullName: 'Yoda Bot',
    username: 'Yoda',
    imageUrl: '/yoda.jpg',
    status: 'online' as UserStatus,
    bio: 'Help you I will. The Force, strong with this one, it is.',
    lastMessageAt: Date.now()
  }
};

// Helper function to remove undefined values from an object
const removeUndefined = (obj: any): any => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [
        key,
        value && typeof value === 'object' ? removeUndefined(value) : value
      ])
  );
};

async function validateAuth(request: NextRequest) {
  try {
    // Try cookie-based auth first
    const { userId } = await auth();
    const user = await currentUser();
    
    if (userId && user) {
      return { userId, user };
    }

    // If cookie auth fails, try Bearer token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const session = await clerk.sessions.getSession(token);
        if (session?.userId) {
          const user = await clerk.users.getUser(session.userId);
          return { userId: user.id, user };
        }
      } catch (error) {
        // Log token verification error but don't throw yet
        console.error('Token verification failed:', error);
      }
    }

    // If both auth methods fail, check if we're in a race condition
    // by waiting a short time and trying cookie auth again
    await new Promise(resolve => setTimeout(resolve, 100));
    const retryAuth = await auth();
    if (retryAuth.userId) {
      const retryUser = await currentUser();
      if (retryUser) {
        return { userId: retryAuth.userId, user: retryUser };
      }
    }

    // If all auth attempts fail, return null
    return { userId: null, user: null };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { userId: null, user: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId, user } = await validateAuth(request);
    
    if (!userId || !user) {
      console.error('Unauthorized request - no userId or user:', { userId, userExists: !!user });
      return NextResponse.json(
        { error: "Failed to get messages", details: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const since = searchParams.get('since');

    if (!channelId) {
      return NextResponse.json({ error: "Missing channelId parameter" }, { status: 400 });
    }

    // Verify the user has access to this channel
    if (channelId.startsWith('dm-')) {
      const [user1Id, user2Id] = channelId.replace('dm-', '').split('-').sort();
      const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
      if (userId !== user1Id && userId !== user2Id && !botId) {
        console.error('User not authorized for this DM channel:', { userId, channelId });
        return NextResponse.json(
          { error: "Failed to get messages", details: "Not authorized for this channel" },
          { status: 403 }
        );
      }
    }

    // If this is a DM with a bot and it's the first fetch, add welcome message
    if (channelId.startsWith('dm-')) {
      const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
      if (botId) {
        const command = new QueryCommand({
          TableName: MESSAGES_TABLE,
          KeyConditionExpression: "channelId = :channelId",
          ExpressionAttributeValues: marshall({
            ":channelId": channelId
          }),
        });

        const response = await dynamoClient.send(command);
        const messages = response.Items ? response.Items.map(item => unmarshall(item)) : [];

        if (messages.length === 0) {
          // Add welcome message using the correct bot profile
          const welcomeMessage = {
            id: uuidv4(),
            channelId,
            userId: botId,
            text: BOT_PROFILES[botId].bio,
            timestamp: Date.now(),
            fullName: BOT_PROFILES[botId].fullName,
            imageUrl: BOT_PROFILES[botId].imageUrl,
            username: BOT_PROFILES[botId].username,
            status: BOT_PROFILES[botId].status
          };

          const putCommand = new PutItemCommand({
            TableName: MESSAGES_TABLE,
            Item: marshall(welcomeMessage),
          });
          await dynamoClient.send(putCommand);
          messages.push(welcomeMessage);

          // Update bot's lastMessageAt in the user's DM list
          const dmUserId = channelId.replace('dm-', '').split('-').find(id => id !== botId);
          if (dmUserId) {
            const userDmUsers = await dmListService.getDMList(dmUserId);
            const timestamp = Date.now();
            const updatedDmUsers = userDmUsers.map(user => {
              if (user.userId === botId) {
                return { ...user, lastMessageAt: timestamp };
              }
              return user;
            });
            await dmListService.saveDMList(dmUserId, updatedDmUsers);
          }
        }

        return NextResponse.json(messages);
      }
    }

    // Regular message fetch
    const command = new QueryCommand({
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: since
        ? "channelId = :channelId AND #ts > :since"
        : "channelId = :channelId",
      ExpressionAttributeValues: marshall(
        since
          ? { ":channelId": channelId, ":since": Number(since) }
          : { ":channelId": channelId }
      ),
      ExpressionAttributeNames: since ? { "#ts": "timestamp" } : undefined,
    });

    const response = await dynamoClient.send(command);
    const messages = response.Items ? response.Items.map(item => unmarshall(item)) : [];

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { error: "Failed to get messages", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, user } = await validateAuth(request);
    
    if (!userId || !user) {
      const authHeader = request.headers.get('authorization');
      console.error('Unauthorized request - no userId or user:', { 
        userId, 
        userExists: !!user,
        headers: {
          authorization: authHeader,
          cookie: request.headers.get('cookie'),
          'content-type': request.headers.get('content-type')
        }
      });

      return NextResponse.json(
        { error: "Failed to send message", details: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: "Failed to parse request body", details: "Invalid JSON" },
        { status: 400 }
      );
    }

    console.log('Received message request:', { 
      ...body,
      userId,
      auth: { hasUserId: !!userId, hasUser: !!user }
    });

    const { text, channelId, fullName, replyToId, replyTo } = body;

    if (!text || !channelId) {
      console.log('Missing required fields:', { text, channelId });
      return NextResponse.json(
        { error: "Missing required fields", details: { text: !text, channelId: !channelId } },
        { status: 400 }
      );
    }

    // Verify the user has access to this channel
    if (channelId.startsWith('dm-')) {
      const [user1Id, user2Id] = channelId.replace('dm-', '').split('-').sort();
      const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
      if (userId !== user1Id && userId !== user2Id && !botId) {
        console.error('User not authorized for this DM channel:', { userId, channelId });
        return NextResponse.json(
          { error: "Failed to send message", details: "Not authorized for this channel" },
          { status: 403 }
        );
      }
    }

    const messageData = {
      id: uuidv4(),
      channelId,
      userId,
      text,
      timestamp: Date.now(),
      fullName: fullName || `${user.firstName} ${user.lastName}` || 'Anonymous',
      imageUrl: user.imageUrl,
      replyToId,
      replyTo,
      reactions: {}
    };

    // Remove any undefined values
    const message = removeUndefined(messageData);
    console.log('Cleaned message data:', message);

    try {
      // Save the message
      const command = new PutItemCommand({
        TableName: MESSAGES_TABLE,
        Item: marshall(message, { removeUndefinedValues: true })
      });

      await dynamoClient.send(command);
      console.log('Message saved successfully');

      // If this is a DM, update lastMessageAt for both users
      if (channelId.startsWith('dm-')) {
        const [user1Id, user2Id] = channelId.replace('dm-', '').split('-').sort();
        const recipientId = user1Id === userId ? user2Id : user1Id;
        
        try {
          // Update both users' DM lists in parallel
          const updatePromises = [];
          
          // Always update sender's DM list
          console.log('Attempting to update sender DM list:', { userId, recipientId });
          updatePromises.push(
            dmListService.updateLastMessageTime(userId, recipientId)
              .then(() => console.log('Successfully updated sender DM list'))
              .catch(error => {
                console.error('Failed to update sender DM list:', {
                  error,
                  userId,
                  recipientId
                });
                throw error;
              })
          );
          
          // Update recipient's DM list if it's not the same user and not the bot
          if (recipientId !== userId && recipientId !== 'chatgenius-bot') {
            console.log('Attempting to update recipient DM list:', { recipientId, userId });
            updatePromises.push(
              dmListService.updateLastMessageTime(recipientId, userId)
                .then(() => console.log('Successfully updated recipient DM list'))
                .catch(error => {
                  console.error('Failed to update recipient DM list:', {
                    error,
                    recipientId,
                    userId
                  });
                  throw error;
                })
            );
          }
          
          await Promise.all(updatePromises).catch(error => {
            // Log error but don't fail the message send
            console.error('Error updating DM lists:', {
              error,
              userId,
              recipientId,
              channelId
            });
            throw error; // Re-throw to trigger retry
          });
        } catch (dmError) {
          // If DM list update fails, retry once after a short delay
          console.log('Retrying DM list update after error...');
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            const updatePromises = [];
            updatePromises.push(dmListService.updateLastMessageTime(userId, recipientId));
            if (recipientId !== userId && recipientId !== 'chatgenius-bot') {
              updatePromises.push(dmListService.updateLastMessageTime(recipientId, userId));
            }
            await Promise.all(updatePromises);
          } catch (retryError) {
            // Log but don't fail the message send
            console.error('Error updating DM lists after retry:', {
              error: retryError,
              userId,
              recipientId,
              channelId
            });
          }
        }
      }
      
      return NextResponse.json(message);
    } catch (dbError) {
      console.error('Database error:', {
        error: dbError,
        name: dbError instanceof Error ? dbError.name : 'Unknown',
        message: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        table: MESSAGES_TABLE,
        messageData: message,
        credentials: {
          hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
          hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Failed to save message', 
          details: dbError instanceof Error ? dbError.message : String(dbError)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in message API:', {
      error,
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process message request', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First, scan to get all items
    const scanParams = {
      TableName: MESSAGES_TABLE
    };

    const { Items = [] } = await dynamoClient.send(new ScanCommand(scanParams));
    
    // Delete each item
    for (const item of Items) {
      const unmarshalled = unmarshall(item);
      const deleteParams = {
        TableName: MESSAGES_TABLE,
        Key: marshall({
          id: unmarshalled.id,
          channelId: unmarshalled.channelId
        }, { removeUndefinedValues: true })
      };

      await dynamoClient.send(new DeleteItemCommand(deleteParams));
    }

    return NextResponse.json({ message: `Cleared ${Items.length} messages` });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Failed to clear messages' },
      { status: 500 }
    );
  }
} 