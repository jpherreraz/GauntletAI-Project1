'use client';

import { createContext, useContext, useState, useMemo } from 'react';
import { Message as MessageType } from '@/src/types/message';

interface ThreadContextType {
  activeThread: MessageType | null;
  setActiveThread: (message: MessageType | null) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [activeThread, setActiveThread] = useState<MessageType | null>(null);

  const handleSetActiveThread = (message: MessageType | null) => {
    setActiveThread(message);
  };

  const value = useMemo(() => ({
    activeThread,
    setActiveThread: handleSetActiveThread
  }), [activeThread]);

  return (
    <ThreadContext.Provider value={value}>
      {children}
    </ThreadContext.Provider>
  );
}

export function useThread() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error('useThread must be used within a ThreadProvider');
  }
  return context;
} 