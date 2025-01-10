'use client'

import { useAuth } from '@clerk/nextjs'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  useEffect(() => {
    if (!isLoaded) return;

    const path = pathname || '';
    
    if (userId && path === '/') {
      router.push('/channels/me');
    } else if (!userId && !path.match(/^\/($|sign-in|sign-up)/)) {
      router.push('/sign-in');
    }
  }, [isLoaded, userId, pathname, router]);

  return children;
} 