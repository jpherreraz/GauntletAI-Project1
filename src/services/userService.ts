export interface UserProfile {
  userId: string;
  username: string;
  imageUrl: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  bio: string | null;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log('Getting user profile for:', userId);
      const response = await fetch(`/api/user-profile?userId=${userId}`);
      
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
      return data;
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
      return data;
    } catch (error) {
      console.error('Error in updateUserProfile:', {
        error,
        message: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }
}; 