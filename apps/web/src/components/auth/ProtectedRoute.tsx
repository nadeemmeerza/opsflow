'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAppSelector } from '@/store/hooks';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const router = useRouter();

  const {
    isAuthenticated,
    isInitialized,
    user,
  } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace('/login');
    }
  }, [
    isInitialized,
    isAuthenticated,
    user,
    router,
  ]);

  // Redux has not restored authentication yet
  if (!isInitialized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}
      >
        Loading...
      </div>
    );
  }

  // Not authenticated.
  // Give the router time to redirect.
  if (!isAuthenticated || !user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}
      >
        Redirecting to login...
      </div>
    );
  }

  return <>{children}</>;
}