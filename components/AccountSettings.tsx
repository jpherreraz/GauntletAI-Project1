'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useClerk, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { messageService } from "@/src/services/messageService"

interface UserInfo {
  displayName: string
  email: string
  username: string
  phoneNumber: string
}

interface AccountSettingsProps {
  user: any
}

export function AccountSettings({ user: clerkUser }: AccountSettingsProps) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user || isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      // First, reassign all messages to deleted user
      await messageService.reassignMessagesToDeletedUser(user.id);

      // Then delete the user profile
      const deleteProfileResponse = await fetch('/api/user-profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!deleteProfileResponse.ok) {
        throw new Error('Failed to delete user profile');
      }

      // Delete the Clerk account through our API route
      const deleteUserResponse = await fetch('/api/delete-user', {
        method: 'DELETE'
      });

      if (!deleteUserResponse.ok) {
        throw new Error('Failed to delete Clerk account');
      }

      // Sign out after successful deletion
      await signOut({
        sessionId: user.primarySessionId || undefined,
        redirectUrl: '/'
      });
      
    } catch (error) {
      console.error('Error deleting account:', error);
      setIsDeleting(false);
      // Show error to user
      alert('Failed to delete account. Please try again.');
    }
  };

  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: clerkUser?.fullName || '',
    email: clerkUser?.primaryEmailAddress?.emailAddress || '',
    username: clerkUser?.username || '',
    phoneNumber: clerkUser?.primaryPhoneNumber?.phoneNumber || ''
  })

  useEffect(() => {
    if (user) {
      setUserInfo({
        displayName: user.fullName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        username: user.username || '',
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || ''
      })
    }
  }, [user])

  const renderField = (field: keyof UserInfo, label: string) => (
    <div className="mb-4">
      <Label htmlFor={field} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex mt-1">
        <Input
          id={field}
          value={userInfo[field]}
          disabled
          className="flex-grow"
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      {renderField('displayName', 'Display Name')}
      {renderField('email', 'Email')}
      {renderField('username', 'Username')}
      {renderField('phoneNumber', 'Phone Number')}

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive"
              disabled={isDeleting}
            >
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting Account...' : 'Delete Account'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

