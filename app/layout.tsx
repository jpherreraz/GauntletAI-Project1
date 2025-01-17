import { Inter } from 'next/font/google'
import { Providers } from './providers'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'ChatGenius',
  description: 'A modern chat application',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full overflow-hidden`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}