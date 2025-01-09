import { DynamoDBClient, PutItemCommand, QueryCommand, GetItemCommand, UpdateItemCommand, ScanCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: 'AKIAW5BDQ6ZZ3EIKJYUI',
    secretAccessKey: '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'
  }
});

export const DELETED_USER_ID = 'deleted_user';

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  text: string;
  timestamp: number;
  username: string;
  replyToId?: string;
}

interface ReactionData {
  messageId: string;
  emoji: string;
  userId: string;
  username: string;
}

interface MessageService {
  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<{ id: string; timestamp: number }>;
  getMessages(channelId: string): Promise<Message[]>;
  toggleReaction(data: ReactionData): Promise<boolean>;
  getMessage(messageId: string): Promise<Message | null>;
  clearMessages(): Promise<boolean>;
  reassignMessagesToDeletedUser(userId: string): Promise<boolean>;
}

export const messageService: MessageService = {
  async sendMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const timestamp = Date.now();
    const id = `${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    const params = {
      TableName: 'Messages',
      Item: marshall({
        id,
        channelId: message.channelId,
        userId: message.userId,
        text: message.text,
        timestamp,
        username: message.username,
        replyToId: message.replyToId || null,
        reactions: {}
      })
    };

    try {
      await dynamoClient.send(new PutItemCommand(params));
      console.log('Message sent to DynamoDB:', { id, timestamp });
      return { id, timestamp };
    } catch (error) {
      console.error('Error sending message to DynamoDB:', error);
      throw error;
    }
  },

  async getMessages(channelId: string) {
    const params = {
      TableName: 'Messages',
      KeyConditionExpression: 'channelId = :channelId',
      ExpressionAttributeValues: marshall({
        ':channelId': channelId
      }),
      ScanIndexForward: true // ascending order
    };

    try {
      const { Items = [] } = await dynamoClient.send(new QueryCommand(params));
      const messages = Items.map(item => {
        const unmarshalled = unmarshall(item);
        // Ensure reactions is always an object
        if (!unmarshalled.reactions) {
          unmarshalled.reactions = {};
        }
        // Ensure replyToId is properly handled
        if (unmarshalled.replyToId === null) {
          delete unmarshalled.replyToId;
        }
        return unmarshalled;
      }) as Message[];
      
      console.log('Retrieved messages:', messages.length);
      return messages;
    } catch (error) {
      console.error('Error getting messages from DynamoDB:', error);
      throw error;
    }
  },

  async toggleReaction({ messageId, emoji, userId, username }: ReactionData) {
    try {
      console.log('Toggling reaction:', { messageId, emoji, userId });
      
      const scanParams = {
        TableName: 'Messages',
        FilterExpression: 'id = :messageId',
        ExpressionAttributeValues: marshall({
          ':messageId': messageId
        })
      };

      const { Items = [] } = await dynamoClient.send(new ScanCommand(scanParams));
      if (!Items.length) throw new Error('Message not found');

      const message = unmarshall(Items[0]);
      const reactions = message.reactions || {};
      const users = reactions[emoji] || [];
      const hasReacted = users.includes(userId);

      const updateParams: any = {
        TableName: 'Messages',
        Key: marshall({
          channelId: message.channelId,
          timestamp: message.timestamp
        })
      };

      if (!message.reactions) {
        updateParams.UpdateExpression = 'SET reactions = :reactions';
        updateParams.ExpressionAttributeValues = marshall({
          ':reactions': { [emoji]: [userId] }
        });
      } else if (hasReacted) {
        if (users.length === 1) {
          updateParams.UpdateExpression = 'REMOVE reactions.#e';
          updateParams.ExpressionAttributeNames = {
            '#e': emoji
          };
        } else {
          updateParams.UpdateExpression = 'SET reactions.#e = :users';
          updateParams.ExpressionAttributeNames = {
            '#e': emoji
          };
          updateParams.ExpressionAttributeValues = marshall({
            ':users': users.filter((id: string) => id !== userId)
          });
        }
      } else {
        updateParams.UpdateExpression = 'SET reactions.#e = :users';
        updateParams.ExpressionAttributeNames = {
          '#e': emoji
        };
        updateParams.ExpressionAttributeValues = marshall({
          ':users': [...users, userId]
        });
      }

      await dynamoClient.send(new UpdateItemCommand(updateParams));
      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  },

  async getMessage(messageId: string): Promise<Message | null> {
    const params = {
      TableName: 'Messages',
      FilterExpression: 'id = :messageId',
      ExpressionAttributeValues: marshall({
        ':messageId': messageId
      })
    };

    const { Items = [] } = await dynamoClient.send(new ScanCommand(params));
    if (!Items.length) return null;
    
    const message = unmarshall(Items[0]) as Message;
    return message;
  },

  async clearMessages() {
    try {
      const params = {
        TableName: 'Messages',
      };

      const { Items = [] } = await dynamoClient.send(new ScanCommand(params));
      
      for (const item of Items) {
        const deleteParams = {
          TableName: 'Messages',
          Key: marshall({
            channelId: unmarshall(item).channelId,
            timestamp: unmarshall(item).timestamp
          })
        };

        await dynamoClient.send(new DeleteItemCommand(deleteParams));
      }

      console.log('Cleared all messages');
      return true;
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  },

  async reassignMessagesToDeletedUser(userId: string): Promise<boolean> {
    try {
      // Get all messages from this user
      const params = {
        TableName: 'Messages',
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId
        })
      };

      const { Items = [] } = await dynamoClient.send(new ScanCommand(params));
      
      // Get message IDs for filtering replies later
      const messageIds = Items.map(item => unmarshall(item).id);
      
      // Update each message to use the deleted user ID
      for (const item of Items) {
        const message = unmarshall(item);
        const updateParams = {
          TableName: 'Messages',
          Key: marshall({
            channelId: message.channelId,
            timestamp: message.timestamp
          }),
          UpdateExpression: 'SET userId = :deletedId, username = :deletedName',
          ExpressionAttributeValues: marshall({
            ':deletedId': DELETED_USER_ID,
            ':deletedName': 'Deleted User'
          }),
          ReturnValues: 'ALL_NEW' as const
        };

        await dynamoClient.send(new UpdateItemCommand(updateParams));
      }

      // Find replies using multiple scans if needed
      for (const messageId of messageIds) {
        const replyParams = {
          TableName: 'Messages',
          FilterExpression: 'replyToId = :messageId',
          ExpressionAttributeValues: marshall({
            ':messageId': messageId
          })
        };

        const { Items: ReplyItems = [] } = await dynamoClient.send(new ScanCommand(replyParams));
        
        // No need to update replies, just keeping them for reference
        console.log(`Found ${ReplyItems.length} replies to message ${messageId}`);
      }

      return true;
    } catch (error) {
      console.error('Error reassigning messages:', error);
      return false;
    }
  }
}; 