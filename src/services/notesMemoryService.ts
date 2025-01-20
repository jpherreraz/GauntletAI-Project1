import { Pinecone } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: process.env.PINECONE_ENVIRONMENT!
});

const PINECONE_INDEX_NAME = 'notes-memory';
const PINECONE_NAMESPACE = 'user-notes';

export const notesMemoryService = {
  /**
   * Initialize the memory store for a user
   */
  async initializeMemoryStore(userId: string, initialText: string) {
    // Get the index
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    // Create text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });

    // Split text into chunks
    const docs = await textSplitter.createDocuments([initialText]);
    
    // Add metadata to each document
    const docsWithMetadata = docs.map(doc => ({
      ...doc,
      metadata: { userId }
    }));

    // Create embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    // Create and store the vectors
    await PineconeStore.fromDocuments(
      docsWithMetadata,
      embeddings,
      {
        pineconeIndex: index,
        namespace: `${PINECONE_NAMESPACE}-${userId}`
      }
    );
  },

  /**
   * Add a new message to the memory store
   */
  async addToMemory(userId: string, text: string) {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      {
        pineconeIndex: index,
        namespace: `${PINECONE_NAMESPACE}-${userId}`
      }
    );

    await vectorStore.addDocuments([
      new Document({
        pageContent: text,
        metadata: { userId }
      })
    ]);
  },

  /**
   * Search for relevant memories
   */
  async searchMemories(userId: string, query: string, k: number = 5): Promise<string[]> {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings,
      {
        pineconeIndex: index,
        namespace: `${PINECONE_NAMESPACE}-${userId}`
      }
    );

    const results = await vectorStore.similaritySearch(query, k);
    return results.map(doc => doc.pageContent);
  },

  /**
   * Clear all memories for a user
   */
  async clearMemories(userId: string) {
    const index = pinecone.Index(PINECONE_INDEX_NAME);
    await index.namespace(`${PINECONE_NAMESPACE}-${userId}`).deleteAll();
  }
}; 