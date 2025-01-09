import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',  // Replace with your region
  credentials: {
    accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',
    secretAccessKey: 'c2bOGkLE9ezXvtKxJmwxjxGqbXzODqrrCchY5954'
  }
});

async function listMessages() {
  try {
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

listMessages(); 