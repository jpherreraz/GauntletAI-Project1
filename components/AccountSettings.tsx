import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserInfo {
  displayName: string
  email: string
  username: string
  phoneNumber: string
}

interface AccountSettingsProps {
  user: any
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    displayName: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    username: user?.username || '',
    phoneNumber: user?.primaryPhoneNumber?.phoneNumber || ''
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
    <div className="max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">Account Settings</h3>
      {renderField('displayName', 'Display Name')}
      {renderField('email', 'Email')}
      {renderField('username', 'Username')}
      {renderField('phoneNumber', 'Phone Number')}
    </div>
  )
}

