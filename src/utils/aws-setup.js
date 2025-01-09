import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',  // Replace with your region if different
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
      { AttributeName: 'timestamp', KeyType: 'RANGE' }  // Sort key
    ],
    AttributeDefinitions: [
      { AttributeName: 'channelId', AttributeType: 'S' },
      { AttributeName: 'timestamp', AttributeType: 'N' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  };

  try {
    const data = await dynamoClient.send(new CreateTableCommand(params));
    console.log("Table created successfully:", data);
    return data;
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log("Table already exists");
    } else {
      console.error("Error creating table:", error);
      throw error;
    }
  }
}

// Run the setup
createMessagesTable(); 