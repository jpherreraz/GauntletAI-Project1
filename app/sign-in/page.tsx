import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-4 rounded-lg shadow-lg">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-500 hover:bg-blue-600',
              footerActionLink: 'text-blue-500 hover:text-blue-600'
            }
          }}
        />
      </div>
    </div>
  );
} 