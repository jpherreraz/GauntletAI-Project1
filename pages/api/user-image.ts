import { createClerkClient } from "@clerk/clerk-sdk-node";
import { NextApiRequest, NextApiResponse } from "next";

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('Missing CLERK_SECRET_KEY environment variable');
}

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const user = await clerk.users.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const imageUrl = user.imageUrl;
    
    return res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error in user-image API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 