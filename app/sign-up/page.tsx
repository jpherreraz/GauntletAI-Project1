import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="p-4 rounded-lg shadow-lg">
        <SignUp 
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