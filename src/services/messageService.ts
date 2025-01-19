import { Message } from "@/src/types/message";
import { UserStatus } from '@/src/services/userService';
import { dmListService } from './dmListService';

interface SendMessageParams {
  channelId: string;
  text: string;
  fullName: string;
  userId: string;
  imageUrl?: string;
  username?: string;
  status?: UserStatus;
  bio?: string;
  replyToId?: string;
  replyTo?: {
    id: string;
    text: string;
    fullName: string;
  };
  token: string | null;
}

async function fetchWithCredentials(url: string, token: string | null, options: RequestInit = {}, retryCount = 0): Promise<Response> {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url,
        method: options.method || 'GET',
        retryCount
      });

      // If we get a 401 or 500 and haven't retried too many times, wait and retry
      if ((response.status === 401 || response.status === 500) && retryCount < 2) {
        console.log(`Request failed with ${response.status}, retrying after delay...`);
        await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)));
        return fetchWithCredentials(url, token, options, retryCount + 1);
      }

      throw new Error(errorData.details || errorData.error || `API request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error('Fetch error:', {
      error,
      url,
      method: options.method || 'GET',
      retryCount
    });
    throw error;
  }
}

export const messageService = {
  async getMessages(channelId: string, token: string | null): Promise<Message[]> {
    try {
      const response = await fetchWithCredentials(`/api/messages?channelId=${channelId}`, token);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  async sendMessage(params: SendMessageParams): Promise<Message> {
    try {
      console.log('Sending message:', {
        channelId: params.channelId,
        text: params.text,
        fullName: params.fullName,
        userId: params.userId
      });

      const response = await fetchWithCredentials('/api/messages', params.token, {
        method: 'POST',
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('Message sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async clearMessages(token: string | null): Promise<void> {
    try {
      const response = await fetchWithCredentials('/api/messages', token, {
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
    channelId,
    token 
  }: { 
    messageId: string; 
    emoji: string; 
    userId: string;
    channelId: string;
    token: string | null;
  }): Promise<boolean> {
    try {
      const response = await fetchWithCredentials('/api/messages/reaction', token, {
        method: 'POST',
        body: JSON.stringify({
          messageId,
          emoji,
          userId,
          channelId
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle reaction');
      }

      return true;
    } catch (error) {
      console.error('Error toggling reaction:', error);
      return false;
    }
  },

  async getMessagesSince(channelId: string, timestamp: number, token: string | null): Promise<Message[]> {
    try {
      const response = await fetchWithCredentials(`/api/messages?channelId=${channelId}&since=${timestamp}`, token);

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