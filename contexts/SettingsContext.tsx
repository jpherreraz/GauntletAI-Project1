'use client'

import { createContext, useContext, useState } from 'react';
import { SettingsMenu } from '@/components/SettingsMenu';
import { useUser } from '@clerk/nextjs';

interface SettingsContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  return (
    <SettingsContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
      {user && <SettingsMenu isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} />}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
} 