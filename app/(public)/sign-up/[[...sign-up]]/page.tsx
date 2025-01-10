import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp afterSignUpUrl="/channels/me" signInUrl="/sign-in" />
    </div>
  );
} 