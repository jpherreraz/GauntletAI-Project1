import { NextApiRequest, NextApiResponse } from "next";
import { messageService } from "@/src/services/messageService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await messageService.clearMessages();
    return res.status(200).json({ message: 'Messages cleared successfully' });
  } catch (error) {
    console.error('Error clearing messages:', error);
    return res.status(500).json({ error: 'Failed to clear messages' });
  }
} 