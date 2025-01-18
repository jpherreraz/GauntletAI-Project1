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
    console.log('ThreadContext: setting active thread:', {
      messageId: message?.id,
      messageText: message?.text?.slice(0, 50),
      action: message ? 'opening' : 'closing'
    });
    setActiveThread(message);
  };

  const value = useMemo(() => ({
    activeThread,
    setActiveThread: handleSetActiveThread
  }), [activeThread]);

  console.log('ThreadContext: rendering with active thread:', activeThread?.id);

  return (
    <ThreadContext.Provider value={value}>
      {children}
    </ThreadContext.Provider>
  );
}

export function useThread() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    console.error('useThread must be used within a ThreadProvider');
    throw new Error('useThread must be used within a ThreadProvider');
  }
  return context;
} 