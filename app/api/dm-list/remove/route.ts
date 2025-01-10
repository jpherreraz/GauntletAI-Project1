import { NextResponse } from "next/server";
import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const TABLE_NAME = process.env.DYNAMODB_TABLE_DM_LISTS || "user-dm-lists";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const targetId = searchParams.get('targetId');

    if (!userId || !targetId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get current DM list
    const getCommand = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ userId })
    });

    const response = await client.send(getCommand);
    if (!response.Item) {
      return NextResponse.json({ success: true }); // Nothing to delete
    }

    // Remove target from DM list
    const currentData = unmarshall(response.Item);
    const updatedDmUsers = currentData.dmUsers.filter(
      (user: any) => user.userId !== targetId
    );

    // Save updated list
    const putCommand = new PutItemCommand({
      TableName: TABLE_NAME,
      Item: marshall({
        userId,
        dmUsers: updatedDmUsers,
        updatedAt: new Date().toISOString()
      }, {
        removeUndefinedValues: true
      })
    });

    await client.send(putCommand);

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('[DELETE] /api/dm-list/remove -', error);
    return NextResponse.json(
      { error: 'Failed to remove DM' },
      { status: 500 }
    );
  }
} 