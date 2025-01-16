import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { UserProfile } from "@/src/services/userService";

const dynamoDb = new DynamoDBClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_DM_LISTS || "user-dm-lists";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId } = body;

    // Get current user's info
    const clerk = await clerkClient();
    const currentUser = await clerk.users.getUser(userId);
    const currentUserInfo: UserProfile = {
      userId: currentUser.id,
      username: currentUser.firstName || 'User',
      imageUrl: currentUser.imageUrl,
      fullName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      status: 'online'
    };

    // Get recipient's info
    const recipientUser = await clerk.users.getUser(recipientId);
    const recipientInfo: UserProfile = {
      userId: recipientUser.id,
      username: recipientUser.firstName || 'User',
      imageUrl: recipientUser.imageUrl,
      fullName: `${recipientUser.firstName} ${recipientUser.lastName}`.trim(),
      status: 'online'
    };

    // Update both users' DM lists
    await Promise.all([
      updateUserDMList(userId, recipientInfo),
      updateUserDMList(recipientId, currentUserInfo)
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/dm-list/add:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

async function updateUserDMList(userId: string, newDMUser: UserProfile) {
  try {
    // Get current DM list
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId }),
    });

    const response = await dynamoDb.send(getCommand);
    let dmUsers: UserProfile[] = [];

    if (response.Item) {
      // User has existing DM list
      const currentData = unmarshall(response.Item);
      dmUsers = currentData.dmUsers || [];
    }

    // Remove if user already exists
    dmUsers = dmUsers.filter(user => user.userId !== newDMUser.userId);
    
    // Add to the beginning of the list
    dmUsers.unshift(newDMUser);

    // Save updated list
    const putCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        userId,
        dmUsers,
        updatedAt: new Date().toISOString(),
      }, {
        removeUndefinedValues: true,
      }),
    });

    await dynamoDb.send(putCommand);
  } catch (error) {
    console.error(`Error updating DM list for user ${userId}:`, error);
    throw error;
  }
} 