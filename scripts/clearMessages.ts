import './loadEnv';
import { DynamoDBClient, ScanCommand, DeleteItemCommand, QueryCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const MESSAGES_TABLE = process.env.DYNAMODB_TABLE_MESSAGES!;

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function main() {
  try {
    console.log('Clearing messages...');
    
    // First, scan to get all channelIds
    const scanParams = {
      TableName: MESSAGES_TABLE,
      ProjectionExpression: 'channelId'
    };

    const { Items = [] } = await dynamoClient.send(new ScanCommand(scanParams));
    const channelIds = [...new Set(Items.map(item => unmarshall(item).channelId))];
    
    let totalDeleted = 0;

    // For each channelId, query and delete its messages
    for (const channelId of channelIds) {
      // Get all messages for this channel
      const queryParams = {
        TableName: MESSAGES_TABLE,
        KeyConditionExpression: 'channelId = :channelId',
        ExpressionAttributeValues: marshall({
          ':channelId': channelId
        })
      };

      const { Items: messages = [] } = await dynamoClient.send(new QueryCommand(queryParams));
      
      // Delete each message
      for (const message of messages) {
        const item = unmarshall(message);
        const deleteParams = {
          TableName: MESSAGES_TABLE,
          Key: marshall({
            channelId: item.channelId,
            timestamp: item.timestamp
          })
        };

        await dynamoClient.send(new DeleteItemCommand(deleteParams));
        totalDeleted++;
      }
    }

    console.log(`Cleared ${totalDeleted} messages successfully`);
  } catch (error) {
    console.error('Error clearing messages:', error);
    process.exit(1);
  }
}

main(); 