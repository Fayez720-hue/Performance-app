'use client';

import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

export function useCustomSession() {
  const { data: session, status } = useSession();

  const signIn = async () => {
    return nextAuthSignIn('google', { callbackUrl: '/dashboard' });
  };

  const signOut = async () => {
    return nextAuthSignOut({ callbackUrl: '/' });
  };

  return { data: session, status, signIn, signOut };
}
