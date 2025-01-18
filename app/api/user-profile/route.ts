import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { clerkClient } from "@clerk/nextjs/server";

// Validate environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_USER_PROFILES;
const dynamoClient: DynamoDBClient | undefined = TABLE_NAME ? new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
}) : undefined;

const BOT_PROFILE = {
  userId: 'chatgenius-bot',
  fullName: 'ChatGenius Bot',
  username: 'ChatGenius',
  imageUrl: '/bot-avatar.png',
  status: 'online',
  bio: 'I am the ChatGenius AI assistant',
  lastMessageAt: Date.now()
};

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/user-profile: Starting request');
    const { userId } = await auth();
    if (!userId) {
      console.log('GET /api/user-profile: Unauthorized - no userId');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    if (!requestedUserId) {
      console.log('GET /api/user-profile: Missing userId parameter');
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    console.log('GET /api/user-profile: Fetching data for userId:', requestedUserId);

    // Special handling for bot profile
    if (requestedUserId === 'chatgenius-bot') {
      console.log('GET /api/user-profile: Returning bot profile');
      return NextResponse.json(BOT_PROFILE);
    }

    // Get user data from Clerk first
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(requestedUserId);
    console.log('GET /api/user-profile: Clerk data:', {
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl
    });

    // Get DynamoDB data if available
    let dynamoData = null;
    if (dynamoClient && TABLE_NAME) {
      try {
        const command = new GetItemCommand({
          TableName: TABLE_NAME,
          Key: marshall({
            userId: requestedUserId
          })
        });

        const response = await dynamoClient.send(command);
        dynamoData = response.Item ? unmarshall(response.Item) : null;
        console.log('GET /api/user-profile: DynamoDB data:', dynamoData);
      } catch (error) {
        console.error('Error fetching DynamoDB data:', error);
      }
    }

    // Combine DynamoDB and Clerk data
    const userData = {
      userId: requestedUserId,
      fullName: clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.username || 'Anonymous',
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
      status: dynamoData?.status || 'online',
      bio: dynamoData?.bio || '',
      lastMessageAt: dynamoData?.lastMessageAt || Date.now()
    };

    console.log('GET /api/user-profile: Returning combined data:', userData);
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Error in GET /api/user-profile:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    if (body.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        userId: body.userId,
        fullName: body.fullName,
        username: body.username,
        status: body.status,
        bio: body.bio,
        lastMessageAt: body.lastMessageAt,
        updatedAt: new Date().toISOString(),
      }, {
        removeUndefinedValues: true,
      }),
    });

    await dynamoClient.send(command);
    
    // Get updated user data from Clerk
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(userId);
    
    // Return combined data
    return NextResponse.json({
      userId,
      fullName: clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.username || 'Anonymous',
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
      status: body.status || 'online',
      bio: body.bio || '',
      lastMessageAt: body.lastMessageAt || Date.now()
    });
  } catch (error) {
    console.error('Error in POST /api/user-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 