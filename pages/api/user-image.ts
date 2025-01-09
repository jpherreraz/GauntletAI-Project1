import { clerkClient } from "@clerk/nextjs";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    if (!user?.imageUrl) {
      // If no image URL is found, return a 404 with null image
      return res.status(404).json({ imageUrl: null });
    }
    return res.status(200).json({ imageUrl: user.imageUrl });
  } catch (error) {
    // Instead of returning a 500 error, return a 404 with null image
    // This prevents error logging for expected cases of missing users
    return res.status(404).json({ imageUrl: null });
  }
} 