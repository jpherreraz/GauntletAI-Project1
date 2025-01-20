// Configure environment variables for LangChain
process.env.LANGSMITH_TRACING = 'true';
process.env.LANGSMITH_ENDPOINT = 'https://api.smith.langchain.com';

if (!process.env.LANGSMITH_API_KEY) {
  throw new Error('LANGSMITH_API_KEY is not set in environment variables');
}

import { Document } from '@langchain/core/documents';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Pinecone } from '@pinecone-database/pinecone';
import { DynamoDBClient, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

// Initialize OpenAI with specific model and configuration
const llm = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize embeddings with specific model
const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-large',
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
});

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

// Define input type for the chain
type ChainInput = string;

export interface StoredMessage {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  fullName: string;
}

export class NotesBotStorage {
  private static instance: NotesBotStorage;
  private vectorStore: PineconeStore | null = null;
  private conversationHistory: Map<string, StoredMessage[]> = new Map();

  private constructor() {}

  public static getInstance(): NotesBotStorage {
    if (!NotesBotStorage.instance) {
      NotesBotStorage.instance = new NotesBotStorage();
    }
    return NotesBotStorage.instance;
  }

  private async fetchMessagesFromDynamoDB(channelId: string): Promise<StoredMessage[]> {
    try {
      const command = new QueryCommand({
        TableName: process.env.DYNAMODB_TABLE_MESSAGES!,
        KeyConditionExpression: "channelId = :channelId",
        ExpressionAttributeValues: {
          ":channelId": { S: channelId }
        }
      });

      const response = await dynamoClient.send(command);
      const messages = response.Items ? response.Items.map(item => {
        const msg = unmarshall(item);
        return {
          id: msg.id,
          text: msg.text,
          timestamp: msg.timestamp,
          userId: msg.userId,
          fullName: msg.fullName
        };
      }) : [];

      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);

      console.log('Fetched messages from DynamoDB:', {
        channelId,
        messageCount: messages.length
      });

      return messages;
    } catch (error) {
      console.error('Error fetching messages from DynamoDB:', error);
      return [];
    }
  }

  private async fetchAllChannelMessages(): Promise<void> {
    try {
      // First, scan DynamoDB to get all unique channelIds
      const scanCommand = new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_MESSAGES!,
        ProjectionExpression: "channelId"
      });

      const response = await dynamoClient.send(scanCommand);
      const channelIds = new Set(
        response.Items
          ?.map(item => unmarshall(item).channelId as string)
          || []
      );

      console.log('Found channels:', {
        channelCount: channelIds.size,
        channels: Array.from(channelIds)
      });

      // Then fetch messages for each channel and update Pinecone
      for (const channelId of channelIds) {
        const messages = await this.fetchMessagesFromDynamoDB(channelId);
        this.conversationHistory.set(channelId, messages);
        
        // Update Pinecone with this channel's history
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          console.log('Updating Pinecone for channel:', {
            channelId,
            messageCount: messages.length,
            lastMessageId: lastMessage.id
          });
          await this.updateVectorStore(channelId, lastMessage);
        }
      }
    } catch (error) {
      console.error('Error fetching all channel messages:', error);
    }
  }

  public async saveMessage(channelId: string, message: StoredMessage): Promise<void> {
    if (!this.vectorStore) {
      await this.initVectorStore();
    }

    // Initialize channel history if needed
    if (!this.conversationHistory.has(channelId)) {
      // First try to get existing history from DynamoDB
      const existingMessages = await this.fetchMessagesFromDynamoDB(channelId);
      this.conversationHistory.set(channelId, existingMessages);
    }

    // Update conversation history
    this.conversationHistory.get(channelId)?.push(message);
    await this.updateVectorStore(channelId, message);

    // If this is a new channel, refresh all channel histories
    if (!this.conversationHistory.has(channelId)) {
      await this.fetchAllChannelMessages();
    }
  }

  private async updateVectorStore(channelId: string, message: StoredMessage): Promise<void> {
    if (!this.vectorStore) {
      await this.initVectorStore();
    }

    try {
      // Create conversation history text from all messages, excluding bot messages
      const messages = this.conversationHistory.get(channelId) || [];
      console.log('Preparing to update vector store for channel:', {
        channelId,
        totalMessages: messages.length,
        userMessages: messages.filter(msg => msg.userId !== 'notes-bot').length
      });

      const conversationHistory = messages
        .filter(msg => msg.userId !== 'notes-bot')  // Exclude bot messages
        .map(msg => `${msg.fullName}: ${msg.text}`)
        .join('\n');

      // Get vector embedding for the conversation
      const vector = await embeddings.embedQuery(conversationHistory);

      // Create the document metadata
      const metadata = {
        id: channelId,
        channelId,
        lastMessageTimestamp: message.timestamp,
        lastMessageId: message.id,
        messageCount: messages.length,
        text: conversationHistory
      };

      // Use Pinecone client directly to upsert
      const index = pinecone.Index(process.env.PINECONE_INDEX!);
      await index.upsert([{
        id: channelId,
        values: vector,
        metadata
      }]);

      console.log('Successfully stored conversation in Pinecone:', {
        channelId,
        messageCount: messages.length,
        contentLength: conversationHistory.length,
        lastMessageId: message.id,
        lastMessageTimestamp: new Date(message.timestamp).toISOString()
      });
    } catch (error) {
      console.error('Error updating vector store:', {
        error,
        channelId,
        messageCount: this.conversationHistory.get(channelId)?.length || 0
      });
      throw error;
    }
  }

  private async initVectorStore(): Promise<void> {
    const index = pinecone.Index(process.env.PINECONE_INDEX!);
    console.log('Initializing vector store...');
    
    this.vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      { pineconeIndex: index }
    );

    // Load all channel histories
    await this.fetchAllChannelMessages();
  }

  public async generateResponse(channelId: string, question: string): Promise<string> {
    if (!this.vectorStore) {
      await this.initVectorStore();
    }

    // Only proceed if the message mentions Notes Bot
    if (!question.includes('@Notes Bot')) {
      return '';
    }

    try {
      // 1. Get vector for the question
      const vector = await embeddings.embedQuery(question);

      // 2. Query Pinecone directly - no filter so we search all channels
      const index = pinecone.Index(process.env.PINECONE_INDEX!);
      const queryResponse = await index.query({
        vector,
        topK: 10, // Increased to get more context across channels
        includeMetadata: true
      });

      // Get the conversation histories from the metadata
      const context = queryResponse.matches
        ?.map(match => {
          const channelContext = match.metadata?.text as string || '';
          const channelId = match.metadata?.channelId as string || '';
          // Add channel context if available
          return channelContext ? `Channel ${channelId}:\n${channelContext}` : '';
        })
        .filter(text => text.length > 0)
        .join('\n\n');

      console.log('Retrieved context from Pinecone:', {
        matchCount: queryResponse.matches?.length || 0,
        contextLength: context.length,
        channels: queryResponse.matches?.map(m => m.metadata?.channelId) || []
      });

      // 3. Use the prompt template with a clearer instruction
      const template = new PromptTemplate({
        template: "You are Notes Bot, a helpful assistant that can recall information from any conversation across all channels. Based on these conversation histories from various channels:\n\n{context}\n\nPlease answer this question: {query}\n\nProvide only your direct response without any prefix or attribution. If referencing information from a specific channel, you can mention it.",
        inputVariables: ["query", "context"]
      });
      const prompt = await template.invoke({ query: question, context });

      // 4. Finally use ChatOpenAI
      const response = await llm.invoke(prompt);
      if (typeof response.content === 'string') {
        return response.content;
      }
      // If it's a complex message content array, only use text content
      return response.content
        .filter(content => typeof content === 'string')
        .join('');
    } catch (error) {
      console.error('Error generating response:', error);
      return 'I apologize, but I am unable to respond at the moment. Please try again later.';
    }
  }
} 