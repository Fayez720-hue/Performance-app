// app/auth/callback/page.tsx
import { Suspense } from 'react';
import AuthCallback from './auth-callback';

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <h2 className="text-xl font-semibold mt-4">Loading...</h2>
          <p className="text-muted-foreground">Completing sign-in...</p>
        </div>
      </div>
    }>
      <AuthCallback />
    </Suspense>
  );
}