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
      router.push('/channels/me');
    } else {
      router.push('/sign-in');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to ChatGenius</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Connect with others through channels and direct messages
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