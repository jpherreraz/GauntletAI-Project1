import { UserProfile } from './userService';

export interface DMList {
  userId: string;
  dmUsers: UserProfile[];
}

export const dmListService = {
  async saveDMList(userId: string, dmUsers: UserProfile[]): Promise<boolean> {
    try {
      const response = await fetch('/api/dm-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          dmUsers,
        }),
      });

      if (!response.ok) throw new Error('Failed to save DM list');
      return true;
    } catch (error) {
      console.error('Error saving DM list:', error);
      return false;
    }
  },

  async getDMList(userId: string): Promise<UserProfile[]> {
    try {
      const response = await fetch(`/api/dm-list?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch DM list');
      const data = await response.json();
      return data.dmUsers;
    } catch (error) {
      console.error('Error fetching DM list:', error);
      return [];
    }
  },
}; 