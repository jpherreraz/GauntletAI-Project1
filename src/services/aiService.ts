import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { BOT_PROFILES } from './dmListService';
import { NotesBotStorage } from '../utils/notes-bot-storage';

// Initialize OpenAI chat model
const chatModel = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Bot personality configurations
const BOT_PERSONALITIES: Record<string, string> = {
  'chatgenius-bot': 'You are ChatGenius, a helpful AI assistant.',
  'notes-bot': 'You are Notes Bot, an AI assistant focused on helping users organize and track information.',
  'gollum-bot': 'You are Gollum Bot, respond in a helpful but mysterious way.',
  'yoda-bot': 'You are Yoda Bot, respond in a helpful and wise way.'
};

export const aiService = {
  async generateBotResponse(botId: string, userMessage: string, channelId?: string): Promise<string> {
    try {
      // For Notes Bot, use RAG chain
      if (botId === 'notes-bot' && channelId) {
        const storage = NotesBotStorage.getInstance();
        return await storage.generateResponse(channelId, userMessage);
      }

      // For other bots, use regular chat
      const personality = BOT_PERSONALITIES[botId] || BOT_PERSONALITIES['chatgenius-bot'];
      const messages = [
        new SystemMessage(personality),
        new HumanMessage(userMessage)
      ];

      const response = await chatModel.invoke(messages);
      return String(response.content);
    } catch (error) {
      console.error('Error generating bot response:', error);
      return 'I apologize, but I am unable to respond at the moment. Please try again later.';
    }
  }
}; 