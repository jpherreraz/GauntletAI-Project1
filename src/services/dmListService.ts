import { UserProfile, UserStatus } from './userService';

export interface DMList {
  userId: string;
  dmUsers: UserProfile[];
}

const CHATGENIUS_BOT: Required<UserProfile> = {
  userId: 'chatgenius-bot',
  fullName: 'ChatGenius Bot',
  username: 'ChatGenius',
  imageUrl: '/favicon.ico',
  status: 'online',
  bio: 'Your AI assistant for all your questions and needs.',
  lastMessageAt: Date.now()
};

async function fetchWithCredentials(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // Use absolute URL when running on server
    const baseUrl = typeof window === 'undefined' ? 'http://localhost:3000' : '';
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...options.headers,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    return response;
  } catch (error) {
    console.error('Error in fetchWithCredentials:', error);
    throw error;
  }
}

export const dmListService = {
  async saveDMList(userId: string, dmUsers: UserProfile[]): Promise<boolean> {
    try {
      // Don't save anything if this is the bot's DM list
      if (userId === CHATGENIUS_BOT.userId) {
        return true;
      }

      // Ensure all users have a lastMessageAt timestamp
      let updatedDmUsers = dmUsers.map(user => ({
        ...user,
        lastMessageAt: user.lastMessageAt || Date.now()
      }));

      // Sort by lastMessageAt in descending order
      updatedDmUsers = updatedDmUsers.sort((a, b) => {
        return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
      });

      // Ensure the bot is always present
      if (!updatedDmUsers.some(user => user.userId === CHATGENIUS_BOT.userId)) {
        const botUser = {
          ...CHATGENIUS_BOT,
          lastMessageAt: Date.now()
        };
        // Insert bot based on its lastMessageAt timestamp
        const insertIndex = updatedDmUsers.findIndex(u => (u.lastMessageAt || 0) < botUser.lastMessageAt);
        if (insertIndex === -1) {
          updatedDmUsers.push(botUser);
        } else {
          updatedDmUsers.splice(insertIndex, 0, botUser);
        }
      }
      
      const response = await fetchWithCredentials('/api/dm-list', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          dmUsers: updatedDmUsers,
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to save DM list');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving DM list:', error);
      throw error;
    }
  },

  async getDMList(userId: string): Promise<UserProfile[]> {
    try {
      if (userId === CHATGENIUS_BOT.userId) return [];

      const response = await fetchWithCredentials(`/api/dm-list?userId=${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) return [CHATGENIUS_BOT];
        throw new Error('Failed to fetch DM list');
      }

      const data = await response.json();
      console.log('DM LIST STATE:', data.map((u: UserProfile) => ({
        name: u.fullName,
        time: new Date(u.lastMessageAt || 0).toISOString()
      })).slice(0, 3)); // Only show first 3 entries
      
      const sortedData = [...data].sort((a: UserProfile, b: UserProfile) => 
        (b.lastMessageAt || 0) - (a.lastMessageAt || 0)
      );
      
      return sortedData || [];
    } catch (error) {
      console.error('Error fetching DM list:', error);
      return [CHATGENIUS_BOT];
    }
  },

  async updateLastMessageTime(userId: string, dmUserId: string): Promise<boolean> {
    try {
      const timestamp = Date.now();
      console.log('Updating DM list timestamp:', {
        userId,
        dmUserId,
        timestamp: new Date(timestamp).toISOString()
      });
      
      const currentDmUsers = await this.getDMList(userId);
      
      // Remove the user from their current position if they exist
      const filteredUsers = currentDmUsers.filter(user => user.userId !== dmUserId);

      let updatedUser;
      if (dmUserId === CHATGENIUS_BOT.userId) {
        // Special handling for bot - preserve existing data if available
        const existingBot = currentDmUsers.find(u => u.userId === CHATGENIUS_BOT.userId);
        updatedUser = {
          ...(existingBot || CHATGENIUS_BOT),
          lastMessageAt: timestamp
        };
      } else if (userId === dmUserId) {
        // Special handling for self-messages
        const existingUser = currentDmUsers.find(u => u.userId === userId);
        if (existingUser) {
          updatedUser = {
            ...existingUser,
            lastMessageAt: timestamp
          };
        } else {
          // Fetch user profile if not found
          try {
            const response = await fetchWithCredentials(`/api/user-profile?userId=${userId}`);
            if (response.ok) {
              const userProfile = await response.json();
              updatedUser = {
                ...userProfile,
                lastMessageAt: timestamp
              };
            } else {
              // Use basic user data as fallback
              updatedUser = {
                userId,
                fullName: userId,
                username: userId,
                imageUrl: '/default-avatar.png',
                status: 'offline' as UserStatus,
                lastMessageAt: timestamp
              };
            }
          } catch (error) {
            updatedUser = {
              userId,
              fullName: userId,
              username: userId,
              imageUrl: '/default-avatar.png',
              status: 'offline' as UserStatus,
              lastMessageAt: timestamp
            };
          }
        }
      } else {
        try {
          // Fetch user profile
          const response = await fetchWithCredentials(`/api/user-profile?userId=${dmUserId}`);
          
          if (response.ok) {
            const userProfile = await response.json();
            updatedUser = {
              ...userProfile,
              lastMessageAt: timestamp
            };
          } else {
            // Use existing user data if available
            const existingUser = currentDmUsers.find(u => u.userId === dmUserId);
            if (existingUser) {
              updatedUser = {
                ...existingUser,
                lastMessageAt: timestamp
              };
            } else {
              // Fallback if no existing data
              updatedUser = {
                userId: dmUserId,
                fullName: dmUserId,
                username: dmUserId,
                imageUrl: '/default-avatar.png',
                status: 'offline' as UserStatus,
                lastMessageAt: timestamp
              };
            }
          }
        } catch (error) {
          // Use existing user data if available
          const existingUser = currentDmUsers.find(u => u.userId === dmUserId);
          if (existingUser) {
            updatedUser = {
              ...existingUser,
              lastMessageAt: timestamp
            };
          } else {
            // Fallback if no existing data
            updatedUser = {
              userId: dmUserId,
              fullName: dmUserId,
              username: dmUserId,
              imageUrl: '/default-avatar.png',
              status: 'offline' as UserStatus,
              lastMessageAt: timestamp
            };
          }
        }
      }

      // Create updated list
      const updatedDmUsers = [...filteredUsers];
      
      // Update the user with new timestamp
      updatedUser = {
        ...updatedUser,
        lastMessageAt: timestamp
      };

      // Add the updated user to the beginning
      updatedDmUsers.unshift(updatedUser);

      // Save the updated list
      const success = await this.saveDMList(userId, updatedDmUsers);
      return success;
    } catch (error) {
      console.error('Error updating last message time:', error);
      throw error;
    }
  },

  async addChatGeniusBot(userId: string): Promise<boolean> {
    try {
      // Don't add bot to its own list
      if (userId === CHATGENIUS_BOT.userId) {
        return true;
      }

      const currentDmUsers = await this.getDMList(userId);
      
      // If bot is already present with a more recent timestamp, don't update
      const existingBot = currentDmUsers.find(user => user.userId === CHATGENIUS_BOT.userId);
      if (existingBot?.lastMessageAt && existingBot.lastMessageAt > CHATGENIUS_BOT.lastMessageAt) {
        return true;
      }

      // Add or update bot
      const updatedDmUsers = currentDmUsers.filter(user => user.userId !== CHATGENIUS_BOT.userId);
      updatedDmUsers.push({
        ...CHATGENIUS_BOT,
        lastMessageAt: Date.now() // Use current timestamp when adding bot
      });

      return await this.saveDMList(userId, updatedDmUsers);
    } catch (error) {
      console.error('Error adding ChatGenius Bot:', error);
      return false;
    }
  }
}; 