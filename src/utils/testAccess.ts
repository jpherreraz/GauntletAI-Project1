import { AppSyncClient, ListGraphqlApisCommand } from "@aws-sdk/client-appsync";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error('Missing required AWS environment variables');
}

const region = process.env.AWS_REGION;
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
};

async function testAccess() {
  try {
    // Test AppSync access
    const appSyncClient = new AppSyncClient({ 
      region,
      credentials
    });
    await appSyncClient.send(new ListGraphqlApisCommand({}));
    console.log('AppSync access: ✅');
  } catch (error) {
    console.log('AppSync access: ❌');
    console.error('AppSync error:', error);
  }

  try {
    // Test DynamoDB access
    const dynamoClient = new DynamoDBClient({ 
      region,
      credentials
    });
    await dynamoClient.send(new ListTablesCommand({}));
    console.log('DynamoDB access: ✅');
  } catch (error) {
    console.log('DynamoDB access: ❌');
    console.error('DynamoDB error:', error);
  }
}

export default testAccess; 