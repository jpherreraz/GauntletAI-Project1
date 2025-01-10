import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const dynamoDb = new DynamoDBClient({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function createTable() {
  const command = new CreateTableCommand({
    TableName: process.env.DYNAMODB_TABLE_DM_LISTS || "user-dm-lists",
    AttributeDefinitions: [
      {
        AttributeName: "userId",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "userId",
        KeyType: "HASH",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });

  try {
    const response = await dynamoDb.send(command);
    console.log("Table created successfully:", response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ResourceInUseException') {
        console.log("Table already exists");
      } else {
        console.error("Error creating table:", error.message);
      }
    } else {
      console.error("Unknown error:", error);
    }
  }
}

createTable(); 