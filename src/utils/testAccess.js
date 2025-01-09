import { AppSyncClient, ListGraphqlApisCommand } from "@aws-sdk/client-appsync";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";

async function testAccess() {
  try {
    // Test AppSync access
    const appSyncClient = new AppSyncClient({ 
      region: 'us-east-2',  // Replace with your region
      credentials: {
        accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',  // Replace with your access key
        secretAccessKey: 'c2bOGkLE9ezXvtKxJmwxjxGqbXzODqrrCchY5954'  // Replace with your secret key
      }
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
      region: 'us-east-2',  // Replace with your region
      credentials: {
        accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',  // Replace with your access key
        secretAccessKey: 'c2bOGkLE9ezXvtKxJmwxjxGqbXzODqrrCchY5954'  // Replace with your secret key
      }
    });
    await dynamoClient.send(new ListTablesCommand({}));
    console.log('DynamoDB access: ✅');
  } catch (error) {
    console.log('DynamoDB access: ❌');
    console.error('DynamoDB error:', error);
  }
}

testAccess(); 