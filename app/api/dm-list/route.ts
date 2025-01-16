import { NextResponse, NextRequest } from "next/server";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { getAuth } from "@clerk/nextjs/server";

const dynamoDb = new DynamoDBClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_DM_LISTS || "user-dm-lists";

export async function GET(request: NextRequest) {
  try {
    // Get auth and params
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    if (!requestedUserId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
    }

    // Verify authorization
    if (requestedUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get DM list from DynamoDB
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({
        userId: requestedUserId,
      }),
    });

    const response = await dynamoDb.send(command);
    const item = response.Item ? unmarshall(response.Item) : { dmUsers: [] };
    return NextResponse.json(item);

  } catch (error) {
    console.error('Error in GET /api/dm-list:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth(request);
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
        dmUsers: body.dmUsers,
        updatedAt: new Date().toISOString(),
      }, {
        removeUndefinedValues: true,
      }),
    });

    await dynamoDb.send(command);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/dm-list:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 