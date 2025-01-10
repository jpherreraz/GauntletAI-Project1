import { 
  DynamoDBClient, 
  CreateTableCommand, 
  ScalarAttributeType,
  KeyType,
  ProjectionType
} from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify credentials are loaded
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error('AWS credentials not found in environment variables');
}

const client = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createMessagesTable() {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_MESSAGES,
    AttributeDefinitions: [
      { 
        AttributeName: 'channelId', 
        AttributeType: ScalarAttributeType.S
      },
      { 
        AttributeName: 'timestamp', 
        AttributeType: ScalarAttributeType.N
      },
      { 
        AttributeName: 'userId', 
        AttributeType: ScalarAttributeType.S
      }
    ],
    KeySchema: [
      { 
        AttributeName: 'channelId', 
        KeyType: KeyType.HASH
      },
      { 
        AttributeName: 'timestamp', 
        KeyType: KeyType.RANGE
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'userId-index',
        KeySchema: [
          { 
            AttributeName: 'userId', 
            KeyType: KeyType.HASH
          }
        ],
        Projection: {
          ProjectionType: ProjectionType.ALL
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
    const data = await client.send(new CreateTableCommand(params));
    console.log("Table created successfully:", data);
    return data;
  } catch (err) {
    console.error("Error creating table:", err);
    throw err;
  }
}

// Run this function to create the table
createMessagesTable()
  .then(() => console.log('Setup complete'))
  .catch(console.error); 