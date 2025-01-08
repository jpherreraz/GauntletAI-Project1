import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, User, LogOut, Paintbrush } from 'lucide-react'
import { AccountSettings } from './AccountSettings'
import { AppearanceSettings } from './AppearanceSettings'
import { Card, CardContent } from "@/components/ui/card"

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export function SettingsMenu({ isOpen, onClose, user }: SettingsMenuProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'appearance' | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <Card className="w-[800px] h-[600px] shadow-lg overflow-hidden">
        <CardContent className="p-0 flex h-full">
          <div className="w-64 bg-secondary h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-2xl font-bold">Settings</h2>
            </div>
            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-2">
                <Button 
                  variant={activeTab === 'account' ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('account')}
                >
                  <User className="mr-2 h-4 w-4" />
                  My Account
                </Button>
                <Button 
                  variant={activeTab === 'appearance' ? "default" : "ghost"} 
                  className="w-full justify-start" 
                  onClick={() => setActiveTab('appearance')}
                >
                  <Paintbrush className="mr-2 h-4 w-4" />
                  Appearance
                </Button>
                <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-100" onClick={() => console.log("Log Out clicked")}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </ScrollArea>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <ScrollArea className="flex-1 p-6">
              {activeTab === 'account' ? (
                <AccountSettings user={user} />
              ) : activeTab === 'appearance' ? (
                <AppearanceSettings />
              ) : (
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-xl font-semibold mb-4">Settings</h3>
                  <p className="text-muted-foreground">Select an option from the sidebar to view or modify your settings.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

