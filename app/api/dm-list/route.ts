import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { UserProfile } from "@/src/services/userService";

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

export async function GET(request: NextRequest) {
  console.log("DM list endpoint - Starting GET request");
  
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("DM list endpoint - Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get userId from query params
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get("userId");
    if (!requestedUserId) {
      console.log("DM list endpoint - Missing userId in query params");
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get current DM list from DynamoDB
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId: requestedUserId })
    });

    const response = await dynamoDb.send(getCommand);
    let dmUsers: UserProfile[] = [];

    if (response.Item) {
      // User has existing DM list
      const currentData = unmarshall(response.Item);
      dmUsers = currentData.dmUsers || [];
    }

    // Ensure the bot is always present
    if (!dmUsers.some(user => user.userId === CHATGENIUS_BOT.userId)) {
      dmUsers.unshift({
        ...CHATGENIUS_BOT,
        lastMessageAt: Date.now()
      });
    }

    // Sort DMs by lastMessageAt in descending order
    dmUsers.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    console.log("DM list endpoint - Success:", {
      userCount: dmUsers.length,
      hasBot: dmUsers.some(u => u.userId === CHATGENIUS_BOT.userId),
      users: dmUsers.map(u => ({
        id: u.userId,
        time: u.lastMessageAt,
        fullName: u.fullName
      }))
    });

    return NextResponse.json(dmUsers);
  } catch (error) {
    console.error("DM list endpoint - Error:", error);
    return NextResponse.json({ error: "Failed to fetch DM list" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log("DM list endpoint - Starting POST request");
  
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log("DM list endpoint - Unauthorized - no userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    if (!body.userId || !body.dmUsers) {
      console.log("DM list endpoint - Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if (body.userId !== userId) {
      console.log("DM list endpoint - User ID mismatch");
      return NextResponse.json({ error: "Unauthorized - user ID mismatch" }, { status: 401 });
    }

    console.log("SAVING DM LIST:", {
      before: body.dmUsers.map((u: UserProfile) => ({
        name: u.fullName,
        time: new Date(u.lastMessageAt || 0).toISOString()
      }))
    });

    // Sort DMs by lastMessageAt in descending order before saving
    const sortedDmUsers = [...body.dmUsers].sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    console.log("AFTER SORT:", {
      after: sortedDmUsers.map((u: UserProfile) => ({
        name: u.fullName,
        time: new Date(u.lastMessageAt || 0).toISOString()
      }))
    });

    const command = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        userId: body.userId,
        dmUsers: sortedDmUsers,
        updatedAt: new Date().toISOString()
      }, {
        removeUndefinedValues: true
      })
    });

    await dynamoDb.send(command);
    
    console.log("DM list endpoint - Successfully saved list");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DM list endpoint - Error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to save DM list',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 