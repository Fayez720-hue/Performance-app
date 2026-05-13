import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/session-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ReturnToAppHandler } from '@/components/auth/return-to-app-handler'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { headers } from 'next/headers'

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''
  
  // Routes where sidebar should NOT appear
  const noSidebarRoutes = ['/login', '/auth/callback']
  const showSidebar = !noSidebarRoutes.some(route => pathname === route || pathname.startsWith(route))

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
            {showSidebar ? (
              <SidebarProvider defaultOpen={true}>
                <AppSidebar />
                <SidebarInset>
                  {children}
                </SidebarInset>
              </SidebarProvider>
            ) : (
              <div className="min-h-screen">
                {children}
              </div>
            )}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}