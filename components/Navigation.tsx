import { SignInButton, SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navigation() {
  return (
    <div className="flex gap-4">
      <SignInButton>
        <Button>Sign In</Button>
      </SignInButton>

      <SignOutButton>
        <Button variant="outline">Sign Out</Button>
      </SignOutButton>
    </div>
  );
} 