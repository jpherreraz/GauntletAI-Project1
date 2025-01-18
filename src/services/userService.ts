export type UserStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export interface UserProfile {
  userId: string;
  fullName: string;
  username?: string;
  imageUrl?: string;
  status?: UserStatus;
  bio?: string;
  lastMessageAt?: number;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Getting user profile for:', userId);
      const response = await fetch(`/api/user-profile?userId=${userId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText
        });
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        return null;
      }

      const data = await response.json();
      console.log('Got user profile:', data);
      return {
        userId,
        fullName: data?.fullName || 'Anonymous',
        username: data?.username,
        imageUrl: data?.imageUrl,
        status: data?.status,
        bio: data?.bio,
        lastMessageAt: data?.lastMessageAt
      };
    } catch (error) {
      console.error('Error in getUserProfile:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  },

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      console.log('Updating profile:', { userId, updates });
      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          ...updates
        }),
      });

      if (!response.ok) {
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText
        });
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        return null;
      }

      const data = await response.json();
      console.log('Updated profile:', data);
      return {
        userId,
        fullName: data?.fullName || 'Anonymous',
        username: data?.username,
        imageUrl: data?.imageUrl,
        status: data?.status,
        bio: data?.bio,
        lastMessageAt: data?.lastMessageAt
      };
    } catch (error) {
      console.error('Error in updateUserProfile:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}; 