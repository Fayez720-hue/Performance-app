

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/components/providers/session-provider'
import { Toaster } from 'sonner'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ReturnToAppHandler } from '@/components/auth/return-to-app-handler'
import { NotificationManager } from '@/components/notifications/notification-manager'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export const dynamic = "force-dynamic"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Scripts removed to prevent interference with Google OAuth security checks */}
      </head>
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
              <SidebarInset className="bg-[#090a11]">
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
