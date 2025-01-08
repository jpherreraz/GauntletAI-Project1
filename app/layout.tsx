import type { Metadata } from 'next'
import { Geist, Azeret_Mono as Geist_Mono } from 'next/font/google'
import '@/app/globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ClerkProvider } from '@clerk/nextjs'
import { SettingsProvider } from '@/contexts/SettingsContext'

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full dark">
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full overflow-hidden`}
        >
          <ThemeProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}



import './globals.css'