import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
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

async function listMessages() {
  try {
    const { Items = [] } = await dynamoClient.send(new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_MESSAGES || 'Messages'
    }));
    
    console.log('Messages in table:');
    Items.forEach(item => {
      console.log(unmarshall(item));
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

listMessages(); 