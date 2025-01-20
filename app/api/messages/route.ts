import { NextResponse, NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand, ScanCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';
import { dmListService } from '@/src/services/dmListService';
import { UserProfile, UserStatus } from '@/src/services/userService';
import { aiService } from '@/src/services/aiService';
import { NotesBotStorage } from '@/src/utils/notes-bot-storage';

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

        // If this is a DM and we have new messages, update the DM list
        if (channelId.startsWith('dm-') && messages.length > 0) {
          const [user1Id, user2Id] = channelId.replace('dm-', '').split('-').sort();
          const otherUserId = user1Id === userId ? user2Id : user1Id;
          const latestMessage = messages[messages.length - 1];
          const timestamp = latestMessage.timestamp;

          try {
            // Get current DM list
            const getCommand = new GetItemCommand({
              TableName: process.env.DYNAMODB_TABLE_DM_LISTS!,
              Key: marshall({ userId })
            });
            const dmResponse = await dynamoClient.send(getCommand);
            let dmUsers = dmResponse.Item ? unmarshall(dmResponse.Item).dmUsers || [] : [];

            // Remove other user from current position if exists
            const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
            dmUsers = dmUsers.filter((user: UserProfile) => 
              botId ? user.userId !== botId : user.userId !== otherUserId
            );

            // Add other user at the beginning with new timestamp
            if (botId) {
              dmUsers.unshift({
                ...BOT_PROFILES[botId],
                lastMessageAt: timestamp
              });
            } else {
              const otherUserProfile = await clerk.users.getUser(otherUserId);
              dmUsers.unshift({
                userId: otherUserId,
                fullName: `${otherUserProfile.firstName} ${otherUserProfile.lastName}`.trim(),
                username: otherUserProfile.username,
                imageUrl: otherUserProfile.imageUrl,
                status: 'online' as UserStatus,
                lastMessageAt: timestamp
              });
            }

            // Save updated list
            const putCommand = new PutItemCommand({
              TableName: process.env.DYNAMODB_TABLE_DM_LISTS!,
              Item: marshall({
                userId,
                dmUsers,
                updatedAt: new Date().toISOString()
              })
            });
            await dynamoClient.send(putCommand);
          } catch (dmError) {
            // Log but don't fail the message fetch
            console.error('Error updating DM list on message fetch:', {
              error: dmError,
              userId,
              otherUserId,
              channelId
            });
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

      // If this is a DM with a bot, generate and save bot response
      if (channelId.startsWith('dm-')) {
        const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
        if (botId) {
          // Initialize storage for Notes Bot
          const storage = NotesBotStorage.getInstance();
          
          // Save user message to storage if it's Notes Bot
          if (botId === 'notes-bot') {
            await storage.saveMessage(channelId, {
              id: message.id,
              text: message.text,
              timestamp: message.timestamp,
              userId: message.userId,
              fullName: message.fullName
            });
          }

          // Get bot response with channelId for context
          const botResponse = await aiService.generateBotResponse(botId, text, channelId);
          
          // Only save bot message if there's a non-empty response
          if (botResponse.trim()) {
            // Create bot message
            const botMessage = {
              id: uuidv4(),
              channelId,
              userId: botId,
              text: botResponse,
              timestamp: Date.now(),
              fullName: BOT_PROFILES[botId].fullName,
              imageUrl: BOT_PROFILES[botId].imageUrl,
              reactions: {}
            };

            // Save bot message to storage if it's Notes Bot
            if (botId === 'notes-bot') {
              await storage.saveMessage(channelId, {
                id: botMessage.id,
                text: botMessage.text,
                timestamp: botMessage.timestamp,
                userId: botMessage.userId,
                fullName: botMessage.fullName
              });
            }

            // Save bot message to DynamoDB
            const botCommand = new PutItemCommand({
              TableName: MESSAGES_TABLE,
              Item: marshall(botMessage, { removeUndefinedValues: true })
            });

            await dynamoClient.send(botCommand);
          }
        }
      }

      // If this is a DM, update lastMessageAt for both users
      if (channelId.startsWith('dm-')) {
        const [user1Id, user2Id] = channelId.replace('dm-', '').split('-').sort();
        const recipientId = user1Id === userId ? user2Id : user1Id;
        const timestamp = Date.now();
        
        try {
          // Update both users' DM lists in parallel
          const updatePromises = [];
          
          // Always update sender's DM list
          console.log('Attempting to update sender DM list:', { userId, recipientId });
          updatePromises.push(
            (async () => {
              // Get sender's current DM list
              const getCommand = new GetItemCommand({
                TableName: process.env.DYNAMODB_TABLE_DM_LISTS!,
                Key: marshall({ userId })
              });
              const response = await dynamoClient.send(getCommand);
              let dmUsers = response.Item ? unmarshall(response.Item).dmUsers || [] : [];
              
              // Remove any existing entries for this user/bot
              const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
              dmUsers = dmUsers.filter((user: UserProfile) => 
                botId ? user.userId !== botId : user.userId !== recipientId
              );
              
              // Add recipient at the beginning with new timestamp
              if (botId) {
                // If recipient is a bot, use bot profile
                dmUsers.unshift({
                  ...BOT_PROFILES[botId],
                  lastMessageAt: timestamp
                });
              } else {
                // Otherwise fetch recipient profile from Clerk
                const recipientProfile = await clerk.users.getUser(recipientId);
                dmUsers.unshift({
                  userId: recipientId,
                  fullName: `${recipientProfile.firstName} ${recipientProfile.lastName}`.trim(),
                  username: recipientProfile.username,
                  imageUrl: recipientProfile.imageUrl,
                  status: 'online' as UserStatus,
                  lastMessageAt: timestamp
                });
              }

              // Save updated list
              const putCommand = new PutItemCommand({
                TableName: process.env.DYNAMODB_TABLE_DM_LISTS!,
                Item: marshall({
                  userId,
                  dmUsers,
                  updatedAt: new Date().toISOString()
                })
              });
              await dynamoClient.send(putCommand);
              console.log('Successfully updated sender DM list');
            })()
          );
          
          // Update recipient's DM list if it's not the same user and not a bot
          const botId = Object.keys(BOT_PROFILES).find(id => channelId.includes(id)) as BotId | undefined;
          if (recipientId !== userId && !botId) {
            console.log('Attempting to update recipient DM list:', { recipientId, userId });
            updatePromises.push(
              (async () => {
                // Get recipient's current DM list
                const getCommand = new GetItemCommand({
                  TableName: process.env.DYNAMODB_TABLE_DM_LISTS!,
                  Key: marshall({ userId: recipientId })
                });
                const response = await dynamoClient.send(getCommand);
                let dmUsers = response.Item ? unmarshall(response.Item).dmUsers || [] : [];
                
                // Remove sender from current position if exists
                dmUsers = dmUsers.filter((user: UserProfile) => user.userId !== userId);
                
                // Add sender at the beginning with new timestamp
                const senderProfile = await clerk.users.getUser(userId);
                dmUsers.unshift({
                  userId: userId,
                  fullName: `${senderProfile.firstName} ${senderProfile.lastName}`.trim(),
                  username: senderProfile.username,
                  imageUrl: senderProfile.imageUrl,
                  status: 'online',
                  lastMessageAt: timestamp
                });

                // Save updated list
                const putCommand = new PutItemCommand({
                  TableName: process.env.DYNAMODB_TABLE_DM_LISTS!,
                  Item: marshall({
                    userId: recipientId,
                    dmUsers,
                    updatedAt: new Date().toISOString()
                  })
                });
                await dynamoClient.send(putCommand);
                console.log('Successfully updated recipient DM list');
              })()
            );
          }

          await Promise.all(updatePromises);
        } catch (dmError) {
          // Log but don't fail the message send
          console.error('Error updating DM lists:', {
            error: dmError,
            userId,
            recipientId,
            channelId
          });
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