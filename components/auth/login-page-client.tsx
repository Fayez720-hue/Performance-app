"use client";
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPageClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [isApp, setIsApp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect if running inside Capacitor native app
    const isCapacitor = !!(window as any).Capacitor;
    setIsApp(isCapacitor);
    if (isCapacitor) {
      // Initialize the native plugin
      GoogleAuth.initialize({
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scopes: ['openid', 'email', 'profile'],
        grantOfflineAccess: true,
      }).catch(console.error);
    }
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      if (isApp) {
        // Native Google Sign‑In (no browser, no custom schemes)
        const user = await GoogleAuth.signIn();
        const idToken = user.authentication.idToken;
        if (!idToken) throw new Error("No ID token received");

        // Exchange ID token for a NextAuth session
        const result = await signIn('credentials', {
          id_token: idToken,
          redirect: false,
        });
        if (result?.error) throw new Error(result.error);
        router.push('/dashboard');
      } else {
        // Web fallback – regular NextAuth Google provider
        await signIn('google', { callbackUrl: '/dashboard' });
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Your existing JSX (the button and card) – unchanged
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <ClipboardList className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold text-card-foreground">
            Task Manager
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isApp ? "Sign in within the app to continue" : "Sign in to manage tasks and track progress"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 pt-2">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isLoading ? "Signing in..." : "Continue with Google"}
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground opacity-60 px-8">
            Manage your daily performance and track team metrics with ease.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}