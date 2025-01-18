import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  console.log('Auth token endpoint - Starting GET request');
  try {
    const authData = await auth();
    console.log('Auth token endpoint - auth data:', {
      hasUserId: !!authData?.userId,
      hasSessionId: !!authData?.sessionId,
      userId: authData?.userId?.slice(0,5),
      sessionIdLength: authData?.sessionId?.length
    });

    if (!authData?.sessionId) {
      console.error('Auth token endpoint - No session ID found');
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    console.log('Auth token endpoint - Returning session ID token');
    return NextResponse.json({ token: authData.sessionId });
  } catch (error) {
    console.error('Auth token endpoint - Error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 