import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const MESSAGES_TABLE = process.env.DYNAMODB_TABLE_MESSAGES!;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, channelId, emoji } = await request.json();
    console.log('Received reaction request:', { messageId, channelId, emoji, userId });

    // First query to get the message
    const queryCommand = new QueryCommand({
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: 'channelId = :channelId',
      FilterExpression: 'id = :messageId',
      ExpressionAttributeValues: marshall({
        ':channelId': channelId,
        ':messageId': messageId
      })
    });

    const { Items } = await dynamoClient.send(queryCommand);
    if (!Items || Items.length === 0) {
      console.error('Message not found:', { messageId, channelId });
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const message = unmarshall(Items[0]);
    console.log('Found message:', message);

    const reactions = message.reactions || {};
    const users = reactions[emoji] || [];

    // Toggle the reaction
    if (users.includes(userId)) {
      reactions[emoji] = users.filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      reactions[emoji] = [...users, userId];
    }

    console.log('Updated reactions:', reactions);

    // Update the message
    const putCommand = new PutItemCommand({
      TableName: MESSAGES_TABLE,
      Item: marshall({
        ...message,
        reactions
      })
    });

    await dynamoClient.send(putCommand);
    
    return NextResponse.json({ success: true, reactions });
  } catch (error) {
    console.error('Error in reaction API:', error);
    return NextResponse.json(
      { error: 'Failed to toggle reaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 