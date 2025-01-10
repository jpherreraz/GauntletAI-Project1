import type { Metadata } from 'next'
import { Geist, Azeret_Mono as Geist_Mono } from 'next/font/google'
import '@/app/globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { AuthProvider } from '@/contexts/AuthContext'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'ChatGenius',
  description: 'A full-screen chat application with channels and dark mode support',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full overflow-hidden`}>
        <ClerkProvider
          fallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL}
          forceRedirectUrl={process.env.NEXT_PUBLIC_CLERK_FORCE_REDIRECT_URL}
          appearance={{
            variables: { colorPrimary: '#0F172A' },
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              card: 'bg-background',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground'
            }
          }}
          dynamic
          cookieOptions={{
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 // 24 hours
          }}
        >
          <AuthProvider>
            <ThemeProvider>
              <SettingsProvider>
                {children}
              </SettingsProvider>
            </ThemeProvider>
          </AuthProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}