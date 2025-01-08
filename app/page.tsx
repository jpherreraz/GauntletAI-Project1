import { SignIn } from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to ChatGenius</h1>
        <p className="text-lg text-gray-600">
          Sign in to start chatting
        </p>
      </div>
      
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <SignIn 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-500 hover:bg-blue-600',
              footerActionLink: 'text-blue-500 hover:text-blue-600'
            }
          }}
          redirectUrl="/chat"
          routing="path"
        />
      </div>
    </div>
  );
}

