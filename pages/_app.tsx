import { ClerkProvider } from '@clerk/nextjs'
import type { AppProps } from 'next/app'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      dynamic
        cookieOptions={{
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24
        }}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  )
}

export default MyApp 