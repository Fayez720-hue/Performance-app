"use client"

export const runtime = 'edge'

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Settings,
  Bell,
  Palette,
  Shield,
  User,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/header"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const userRole = (session?.user as any)?.role || "Viewer"

  const sections = [
    {
      title: "Account",
      description: "Manage your profile and account details",
      items: [
        {
          icon: User,
          label: "Profile",
          description: session?.user?.email || "No email linked",
          action: () => {}
        },
        {
          icon: Shield,
          label: "Security",
          description: "Manage your Google account link",
          action: () => window.open("https://myaccount.google.com/security", "_blank")
        },
      ]
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of the app",
      items: [
        {
          icon: theme === "dark" ? Moon : Sun,
          label: "Dark Mode",
          description: "Toggle between light and dark themes",
          rightElement: (
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          )
        },
      ]
    },
    {
      title: "App Settings",
      description: "General application configuration",
      items: [
        { icon: Bell, label: "Notifications", description: "Manage browser alerts", action: () => {} },
      ]
    }
  ]

  // Add Admin-only section
  if (userRole === "Admin" || userRole === "Manager") {
    sections.push({
      title: "Administration",
      description: "Tools for team management",
      items: [
        {
          icon: Users,
          label: "User Management",
          description: "Manage team roles and sheets",
          action: () => router.push("/admin/users")
        },
      ]
    })
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">

        {/* Profile Section */}
        <div className="flex flex-col items-center text-center mb-10 mt-4">
          <Avatar className="h-24 w-24 mb-4 ring-2 ring-primary/10">
            <AvatarImage src={session?.user?.image || ""} />
            <AvatarFallback className="text-2xl bg-primary/5">
              {session?.user?.name?.substring(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">{session?.user?.name}</h1>
          <p className="text-muted-foreground">{userRole}</p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div className="px-1">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h2>
              </div>
              <Card className="overflow-hidden border-none bg-muted/30 shadow-none">
                <CardContent className="p-0">
                  {section.items.map((item, index) => (
                    <div key={item.label}>
                      <div
                        className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      >
                        <div
                          className="flex items-center gap-4 text-left flex-1 cursor-pointer"
                          onClick={() => item.action?.()}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background shadow-sm">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        {item.rightElement ? (
                          item.rightElement
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {index < section.items.length - 1 && <Separator className="opacity-50" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}

          {/* Logout Section */}
          <div className="pt-4">
            <Button
              variant="destructive"
              className="w-full justify-center gap-2 h-12 text-base font-semibold"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
            <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase tracking-tighter opacity-50">
              Version 1.0.0 • Production Release
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t shadow-lg md:hidden z-50">
        <div className="flex justify-around py-2 max-w-md mx-auto">
          <button onClick={() => router.push("/dashboard")} className="flex flex-col items-center px-4 py-1 text-muted-foreground hover:text-primary transition-colors">
            <span className="text-xl">🏠</span><span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => router.push("/tasks")} className="flex flex-col items-center px-4 py-1 text-muted-foreground hover:text-primary transition-colors">
            <span className="text-xl">✅</span><span className="text-[10px] font-medium">Tasks</span>
          </button>
          <button onClick={() => router.push("/reports")} className="flex flex-col items-center px-4 py-1 text-muted-foreground hover:text-primary transition-colors">
            <span className="text-xl">📊</span><span className="text-[10px] font-medium">Reports</span>
          </button>
          <button className="flex flex-col items-center px-4 py-1 text-primary">
            <Settings className="h-6 w-6 mb-0.5" /><span className="text-[10px] font-bold">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
