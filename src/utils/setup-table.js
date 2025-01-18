import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error('Missing required AWS environment variables');
}

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createMessagesTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_MESSAGES || 'Messages',
    KeySchema: [
      { AttributeName: 'channelId', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'id', KeyType: 'RANGE' }  // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'channelId', AttributeType: 'S' },
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'ChannelTimestampIndex',
        KeySchema: [
          { AttributeName: 'channelId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    await dynamoClient.send(new CreateTableCommand(params));
    console.log("Table created successfully");
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log("Table already exists");
    } else {
      console.error("Error creating table:", error);
      throw error;
    }
  }
}

createMessagesTable(); 