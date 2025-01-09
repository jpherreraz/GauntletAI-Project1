import { DynamoDBClient, CreateTableCommand, DeleteTableCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function recreateTable() {
  try {
    // Delete existing table if it exists
    try {
      await dynamoClient.send(new DeleteTableCommand({ TableName: 'Messages' }));
      console.log('Waiting for table deletion...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    } catch (e) {
      console.log('Table does not exist, proceeding with creation');
    }

    // Create new table with MessageIdIndex
    const params = {
      TableName: 'Messages',
      KeySchema: [
        { AttributeName: 'channelId', KeyType: 'HASH' },
        { AttributeName: 'timestamp', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'channelId', AttributeType: 'S' },
        { AttributeName: 'timestamp', AttributeType: 'N' },
        { AttributeName: 'id', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'MessageIdIndex',
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
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

    await dynamoClient.send(new CreateTableCommand(params));
    console.log('Table created successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

recreateTable(); 