// app/auth/callback/auth-callback.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    const isAppBrowser =
      (window as any).Capacitor !== undefined ||
      /CSPerformanceApp/i.test(navigator.userAgent) ||
      searchParams?.get("app") === "1";

    // collect query params and fragment tokens
    const qp = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = qp.get("code");
    const state = qp.get("state");
    const id_token = hash.get("id_token");
    const access_token = hash.get("access_token");

    const params = new URLSearchParams();
    if (callbackUrl) params.set("url", callbackUrl);
    if (code) params.set("code", code);
    if (state) params.set("state", state);
    if (id_token) params.set("id_token", id_token);
    if (access_token) params.set("access_token", access_token);
    if (searchParams?.get("app") === "1") params.set("app", "1");

    const nativeScheme = /Android/i.test(navigator.userAgent)
      ? "performanceapp"
      : "com.canshift.performanceapp";

    const deepLink = `${nativeScheme}://callback?${params.toString()}`;

    if (isAppBrowser) {
      // deep link back to the mobile app with all relevant tokens/params
      window.location.replace(deepLink);
      // also set href as a fallback for some WebViews/browsers
      window.location.href = deepLink;
    } else {
      // web: navigate to the app callback route (server-side handling)
      router.push(callbackUrl);
    }
  }, [router, callbackUrl, searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Completing Sign-In</h2>
        <p className="text-muted-foreground">Redirecting you...</p>
        <noscript>
          <p className="text-sm text-muted-foreground">
            JavaScript is required to complete sign-in. If nothing happens, copy and open the link shown.
          </p>
        </noscript>
      </div>
    </div>
  );
}