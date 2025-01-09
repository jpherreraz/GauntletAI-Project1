const { DynamoDBClient, PutItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({ region: 'us-east-1' }); // Replace with your region

exports.handler = async (event) => {
    const { routeKey } = event;
    
    switch (routeKey) {
        case '$connect':
            return handleConnect(event);
        case '$disconnect':
            return handleDisconnect(event);
        case 'sendMessage':
            return handleMessage(event);
        default:
            return { statusCode: 400, body: 'Unknown route' };
    }
};

async function handleConnect(event) {
    // Store connection ID
    return { statusCode: 200, body: 'Connected' };
}

async function handleDisconnect(event) {
    // Remove connection ID
    return { statusCode: 200, body: 'Disconnected' };
}

async function handleMessage(event) {
    try {
        const body = JSON.parse(event.body);
        const { channelId, message, userId } = body;
        
        const params = {
            TableName: 'Messages',
            Item: marshall({
                channelId: channelId,
                timestamp: Date.now(),
                message: message,
                userId: userId
            })
        };
        
        await dynamoClient.send(new PutItemCommand(params));
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Message sent successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send message' })
        };
    }
} 