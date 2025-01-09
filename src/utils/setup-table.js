import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',  // Replace with your region
  credentials: {
    accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',
    secretAccessKey: 'c2bOGkLE9ezXvtKxJmwxjxGqbXzODqrrCchY5954'
  }
});

async function createMessagesTable() {
  const params = {
    TableName: 'Messages',
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