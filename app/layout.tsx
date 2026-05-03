import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/session-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ReturnToAppHandler } from '@/components/auth/return-to-app-handler'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

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
            <SidebarProvider defaultOpen={true}>
              <AppSidebar />
              <SidebarInset className="bg-background">
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