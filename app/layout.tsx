'use client';

import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/components/providers/session-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ReturnToAppHandler } from '@/components/auth/return-to-app-handler'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { BrowserHandler } from '@/components/browser-handler';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname === '/auth/callback';
  
  if (isLoginPage) {
    return <div className="min-h-screen">{children}</div>;
  }
  
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ReturnToAppHandler />
            <NotificationManager />
            <BrowserHandler />
            <LayoutContent>
              {children}
            </LayoutContent>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}