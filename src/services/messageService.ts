import { Message } from "@/src/types/message";

export const messageService = {
  async getMessages(channelId: string): Promise<Message[]> {
    try {
      const response = await fetch(`/api/messages?channelId=${channelId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  async sendMessage({ 
    channelId, 
    text,
    fullName,
    userId,
    imageUrl,
    replyToId,
    replyTo
  }: { 
    channelId: string; 
    text: string;
    fullName: string;
    userId: string;
    imageUrl?: string;
    replyToId?: string;
    replyTo?: {
      id: string;
      text: string;
      fullName: string;
    };
  }): Promise<Message> {
    try {
      console.log('Sending message:', { channelId, text, fullName, userId, imageUrl, replyToId, replyTo }); // Debug log

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          text,
          fullName,
          userId,
          imageUrl,
          replyToId,
          replyTo
        }),
      });

      const data = await response.json();
      console.log('Response from server:', data); // Debug log

      if (!response.ok) {
        console.error('Server error:', data); // Debug log
        throw new Error(data.error || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  async clearMessages(): Promise<void> {
    try {
      const response = await fetch('/api/messages', {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear messages');
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      throw error;
    }
  },

  async toggleReaction({ 
    messageId, 
    emoji, 
    userId,
    channelId 
  }: { 
    messageId: string; 
    emoji: string; 
    userId: string;
    channelId: string;
  }): Promise<boolean> {
    try {
      console.log('Sending reaction:', { messageId, emoji, userId, channelId }); // Debug log

      const response = await fetch('/api/messages/reaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          emoji,
          userId,
          channelId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Reaction API error:', data); // Debug log
        throw new Error(data.error || 'Failed to toggle reaction');
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  },

  async getMessagesSince(channelId: string, timestamp: number): Promise<Message[]> {
    try {
      const response = await fetch(`/api/messages?channelId=${channelId}&since=${timestamp}`, {
        method: 'GET'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get messages');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting messages since timestamp:', error);
      return [];
    }
  }
}; 