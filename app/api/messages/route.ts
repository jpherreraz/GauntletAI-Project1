import { NextResponse, NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { DynamoDBClient, PutItemCommand, QueryCommand, DeleteItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const MESSAGES_TABLE = process.env.DYNAMODB_TABLE_MESSAGES!;

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

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');
    const since = searchParams.get('since');

    if (!channelId) {
      return NextResponse.json({ error: "Missing channelId" }, { status: 400 });
    }

    let params: any = {
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: 'channelId = :channelId',
      ExpressionAttributeValues: marshall({
        ':channelId': channelId
      }, { removeUndefinedValues: true }),
      ScanIndexForward: true
    };

    if (since) {
      params.KeyConditionExpression += ' AND #ts > :timestamp';
      params.ExpressionAttributeNames = {
        '#ts': 'timestamp'
      };
      params.ExpressionAttributeValues = marshall({
        ':channelId': channelId,
        ':timestamp': parseInt(since)
      }, { removeUndefinedValues: true });
    }

    const { Items = [] } = await dynamoClient.send(new QueryCommand(params));
    const messages = Items.map(item => unmarshall(item));
    
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Failed to get messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received message request:', body); // Debug log

    const { text, channelId, fullName, replyToId, replyTo } = body;

    if (!text || !channelId) {
      console.log('Missing fields:', { text, channelId }); // Debug log
      return NextResponse.json(
        { error: "Missing required fields", fields: { text, channelId } },
        { status: 400 }
      );
    }

    const messageData = {
      id: uuidv4(),
      channelId,
      userId,
      text,
      timestamp: Date.now(),
      fullName: fullName || user?.firstName || 'Anonymous',
      imageUrl: user?.imageUrl,
      replyToId,
      replyTo,
      reactions: {}
    };

    // Remove any undefined values
    const message = removeUndefined(messageData);
    console.log('Cleaned message data:', message); // Debug log

    const command = new PutItemCommand({
      TableName: MESSAGES_TABLE,
      Item: marshall(message, { removeUndefinedValues: true })
    });

    try {
      await dynamoClient.send(command);
      console.log('Message saved successfully'); // Debug log
    } catch (dbError) {
      console.error('DynamoDB error:', dbError); // Debug log
      throw dbError;
    }
    
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in message API:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      table: MESSAGES_TABLE,
      credentials: {
        hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    return NextResponse.json(
      { 
        error: 'Failed to send message', 
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