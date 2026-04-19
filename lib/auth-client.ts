'use client';

import { useEffect, useState } from 'react';

interface User {
  name: string;
  email: string;
  image?: string | null;
  role?: string;
}

interface Session {
  user: User | null;
  expires: string | null;
}

export function useCustomSession() {
  const [session, setSession] = useState<Session>({ user: null, expires: null });
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setSession(data);
      setStatus(data.user ? 'authenticated' : 'unauthenticated');
    } catch (error) {
      console.error('Failed to fetch session:', error);
      setStatus('unauthenticated');
    }
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      await fetchSession();
      return { success: true };
    } else {
      const error = await res.json();
      return { success: false, error: error.error };
    }
  };

  const signOut = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    window.location.href = '/';
  };

  return { data: session, status, signIn, signOut };
}