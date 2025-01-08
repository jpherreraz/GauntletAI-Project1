import { SignInButton, SignOutButton, UserButton } from "@clerk/nextjs";

// For signed-out users
<SignInButton>
  <Button>Sign In</Button>
</SignInButton>

// For signed-in users
<UserButton afterSignOutUrl="/" /> 