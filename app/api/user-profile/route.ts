import { 
  DynamoDBClient, 
  GetItemCommand, 
  PutItemCommand, 
  CreateTableCommand,
  DeleteItemCommand,
  ScalarAttributeType,
  KeyType
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { NextResponse } from 'next/server'

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',
    secretAccessKey: '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'
  }
});

async function ensureTableExists() {
  try {
    const params = {
      TableName: 'UserProfiles',
      KeySchema: [
        { AttributeName: 'userId', KeyType: KeyType.HASH }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: ScalarAttributeType.S }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    };

    await dynamoClient.send(new CreateTableCommand(params));
    // Wait for table to be active
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Table created successfully');
  } catch (error: any) {
    if (error.name !== 'ResourceInUseException') {
      console.error('Error creating table:', error);
      throw error;
    }
  }
}

export async function GET(request: Request) {
  try {
    await ensureTableExists();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    }

    const params = {
      TableName: 'UserProfiles',
      Key: marshall({ userId })
    };

    const { Item } = await dynamoClient.send(new GetItemCommand(params));
    return NextResponse.json(Item ? unmarshall(Item) : null);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTableExists();

    const profile = await request.json();

    if (!profile.userId || !profile.username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const params = {
      TableName: 'UserProfiles',
      Item: marshall({
        userId: profile.userId,
        username: profile.username,
        status: profile.status || 'online',
        imageUrl: profile.imageUrl,
        bio: profile.bio || "Hey there! I'm using GauntletAI Chat.",
        lastSeen: Date.now()
      })
    };

    await dynamoClient.send(new PutItemCommand(params));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const params = {
      TableName: 'UserProfiles',
      Key: marshall({ userId })
    };

    await dynamoClient.send(new DeleteItemCommand(params));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 