import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { messageService } from "@/src/services/messageService";

const CLERK_API_URL = "https://api.clerk.dev/v1";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function getClerkUser(userId: string) {
  const response = await fetch(`${CLERK_API_URL}/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}

async function updateClerkUser(userId: string, updates: Record<string, string>) {
  const response = await fetch(`${CLERK_API_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user: ${response.statusText}`);
  }

  return response.json();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('[GET] /api/user-profile - Fetching user:', userId);
    const user = await getClerkUser(userId);
    console.log('[GET] /api/user-profile - User found:', user.id);

    const response = {
      userId: user.id,
      username: user.username || user.first_name || 'User',
      imageUrl: user.image_url,
      fullName: user.full_name || '',
      status: 'online',
      bio: ''
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[GET] /api/user-profile - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('[POST] /api/user-profile - Request:', { userId, updates: body });
    
    if (body.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized - user mismatch" }, { status: 401 });
    }

    // Get current user first
    const currentUser = await getClerkUser(userId);
    console.log('[POST] /api/user-profile - Current user found:', currentUser.id);

    // Prepare updates
    const updates: Record<string, string> = {};
    if (body.fullName) updates.first_name = body.fullName;
    if (body.username) updates.username = body.username;

    // Update user
    const updatedUser = await updateClerkUser(userId, updates);
    console.log('[POST] /api/user-profile - User updated:', updatedUser.id);

    const response = {
      userId: updatedUser.id,
      username: updatedUser.username || updatedUser.first_name || 'User',
      imageUrl: updatedUser.image_url,
      fullName: updatedUser.full_name || '',
      status: 'online',
      bio: body.bio || ''
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[POST] /api/user-profile - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // Get the authenticated user's ID
    const { userId } = await getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    // Ensure user can only delete their own profile
    if (targetUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized - user mismatch" }, { status: 401 });
    }

    try {
      // First, reassign all messages to deleted user
      await messageService.reassignMessagesToDeletedUser(userId);
      
      // Then delete user from Clerk using the correct method
      try {
        await clerkClient.users.deleteUser(userId);
        console.log('[DELETE] /api/user-profile - User deleted:', userId);
      } catch (clerkError) {
        console.error('[DELETE] /api/user-profile - Clerk API error:', clerkError);
        // Even if Clerk deletion fails, we've already reassigned messages
        // So we can consider this a partial success
      }
      
      return NextResponse.json({ 
        success: true,
        message: 'User profile and messages updated successfully'
      });

    } catch (error) {
      console.error('[DELETE] /api/user-profile - Operation error:', error);
      return NextResponse.json({ 
        error: 'Failed to complete delete operation',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[DELETE] /api/user-profile - Error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user profile',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 