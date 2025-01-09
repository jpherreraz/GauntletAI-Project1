export interface UserProfile {
  userId: string;
  username: string;
  imageUrl?: string;
  status: 'online' | 'idle' | 'dnd' | 'invisible';
  bio?: string;
  lastSeen?: number;
  isDeleted?: boolean;
}

export const userService = {
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`/api/user-profile?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  async updateUserProfile(profile: Partial<UserProfile> & { userId: string }): Promise<boolean> {
    try {
      // Debug log
      console.log('Received profile data:', profile);

      // Validate required fields
      if (!profile.userId) {
        console.error('Missing userId');
        throw new Error('Missing required fields: userId');
      }
      if (!profile.username) {
        console.error('Missing username');
        throw new Error('Missing required fields: username');
      }

      // Construct the profile data with defaults
      const profileData = {
        userId: profile.userId,
        username: profile.username,
        status: profile.status || 'online',
        bio: profile.bio || "Hey there! I'm using GauntletAI Chat.",
        imageUrl: profile.imageUrl,
        lastSeen: Date.now()
      };

      // Debug log
      console.log('Sending profile data:', profileData);

      const response = await fetch('/api/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API response error:', error);
        throw new Error(error.message || 'Failed to update profile');
      }

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}; 