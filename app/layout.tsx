import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/session-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ReturnToAppHandler } from '@/components/auth/return-to-app-handler'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarTrigger } from '@/components/ui/sidebar-trigger'

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
            <SidebarProvider defaultOpen={false}>
              <AppSidebar />
              <SidebarInset className="relative flex flex-1 flex-col bg-background">
                {/* Sticky header with toggle button */}
                <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4">
                  <SidebarTrigger />
                  <h1 className="text-lg font-semibold">Can Shift</h1>
                </div>
                {children}
              </SidebarInset>
            </SidebarProvider>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}