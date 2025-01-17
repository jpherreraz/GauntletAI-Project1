'use client'

import { createContext, useContext, useState, useCallback, FC, ReactNode } from 'react';

interface Settings {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  notifications: boolean;
}

interface SettingsContextType {
  settings: Settings;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setNotifications: (enabled: boolean) => void;
}

const defaultSettings: Settings = {
  sidebarCollapsed: false,
  theme: 'dark',
  notifications: true
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSettings(prev => ({ ...prev, sidebarCollapsed: collapsed }));
  }, []);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const setNotifications = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, notifications: enabled }));
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSidebarCollapsed,
        setTheme,
        setNotifications
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}; 