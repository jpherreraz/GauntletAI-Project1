import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignIn 
        afterSignInUrl="/channels/me"
        signUpUrl="/sign-up"
        afterSignUpUrl="/channels/me"
        redirectUrl="/channels/me"
      />
    </div>
  );
} 