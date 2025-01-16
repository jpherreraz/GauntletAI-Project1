import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
  console.log('Testing AWS Connection...');
  console.log('Access Key ID:', process.env.AWS_ACCESS_KEY_ID?.slice(0, 5) + '...');
  console.log('Has Secret Key:', !!process.env.AWS_SECRET_ACCESS_KEY);

  const client = new DynamoDBClient({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
  });

  try {
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    console.log('Connection successful!');
    console.log('Tables:', response.TableNames);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection(); 