import fs from 'fs';
import path from 'path';
import { Message } from '@/src/types/message';

const NOTES_STORE_DIR = path.join(process.cwd(), 'data', 'notes');

// Ensure the notes directory exists
if (!fs.existsSync(NOTES_STORE_DIR)) {
  fs.mkdirSync(NOTES_STORE_DIR, { recursive: true });
}

export const messageStore = {
  /**
   * Save a message to the user's notes file
   */
  async saveMessage(userId: string, message: Message): Promise<void> {
    // Only save messages in conversations with Notes Bot
    if (!message.channelId.includes('notes-bot')) {
      return;
    }

    const userNotesPath = path.join(NOTES_STORE_DIR, `${userId}.txt`);
    
    // Format the message with timestamp and content
    const timestamp = new Date(message.timestamp).toISOString();
    const messageText = `[${timestamp}] ${message.fullName}: ${message.text}\n`;
    
    // Append to file
    await fs.promises.appendFile(userNotesPath, messageText, 'utf-8');
  },

  /**
   * Get all messages for a user
   */
  async getUserMessages(userId: string): Promise<string> {
    const userNotesPath = path.join(NOTES_STORE_DIR, `${userId}.txt`);
    
    try {
      return await fs.promises.readFile(userNotesPath, 'utf-8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return ''; // Return empty string if file doesn't exist
      }
      throw error;
    }
  },

  /**
   * Clear all messages for a user
   */
  async clearUserMessages(userId: string): Promise<void> {
    const userNotesPath = path.join(NOTES_STORE_DIR, `${userId}.txt`);
    
    try {
      await fs.promises.unlink(userNotesPath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}; 