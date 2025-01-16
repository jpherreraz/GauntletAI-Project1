'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SettingsProvider } from '@/contexts/SettingsContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: { colorPrimary: '#0F172A' },
        elements: {
          formButtonPrimary: 'bg-slate-900 hover:bg-slate-800 text-sm normal-case',
          card: 'bg-white shadow-none',
          headerTitle: 'text-slate-900',
          headerSubtitle: 'text-slate-600',
        },
      }}
    >
      <ThemeProvider>
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </ThemeProvider>
    </ClerkProvider>
  )
} 