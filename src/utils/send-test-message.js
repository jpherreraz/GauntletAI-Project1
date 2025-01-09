import { DynamoDBClient, PutItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',  // Replace with your region
  credentials: {
    accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',
    secretAccessKey: 'c2bOGkLE9ezXvtKxJmwxjxGqbXzODqrrCchY5954'
  }
});

async function sendTestMessage() {
  const timestamp = Date.now();
  const id = `${timestamp}-test`;
  
  const params = {
    TableName: 'Messages',
    Item: marshall({
      id,
      channelId: 'general',
      userId: 'test-user',
      text: 'This is a test message!',
      timestamp,
      username: 'Test User'
    })
  };

  try {
    await dynamoClient.send(new PutItemCommand(params));
    console.log('Test message sent successfully!');
    
    // Now let's check if it's in the table
    console.log('Checking messages...');
    const { Items = [] } = await dynamoClient.send(new ScanCommand({
      TableName: 'Messages'
    }));
    
    console.log('Messages in table:');
    Items.forEach(item => {
      console.log(unmarshall(item));
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTestMessage(); 