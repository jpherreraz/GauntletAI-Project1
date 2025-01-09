'use client'

import { Button } from "@/components/ui/button"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { SignIn } from "@clerk/nextjs"
import { useState } from "react"

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [showSignIn, setShowSignIn] = useState(false);

  const handleStartChatting = () => {
    if (isSignedIn) {
      router.push('/chat');
    } else {
      setShowSignIn(true);
    }
  };

  if (showSignIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SignIn afterSignInUrl="/chat" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to GauntletAI Chat</h1>
      <p className="text-xl mb-8 text-muted-foreground max-w-lg">
        Experience the future of AI-powered conversations. Connect, share, and explore with our intelligent chat platform.
      </p>
      <Button 
        size="lg" 
        onClick={handleStartChatting}
        className="text-lg px-8"
      >
        {isSignedIn ? 'Go to Chat' : 'Start Chatting'}
      </Button>
    </div>
  )
} 