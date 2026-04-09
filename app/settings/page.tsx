"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Settings, Bell, Palette, Shield, User, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/header"

export default function SettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const sections = [
    {
      title: "Account",
      description: "Manage your profile and account details",
      items: [
        { icon: User, label: "Profile", description: "Name, email, and avatar", action: () => {} },
        { icon: Shield, label: "Security", description: "Password and authentication", action: () => {} },
      ]
    },
    {
      title: "Appearance",
      description: "Customize the look and feel of the app",
      items: [
        { icon: Palette, label: "Theme", description: "Switch between light and dark mode", action: () => {} },
      ]
    },
    {
      title: "App Settings",
      description: "General application configuration",
      items: [
        { icon: Bell, label: "Notifications", description: "Manage how you receive alerts", action: () => {} },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl pb-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground text-sm">
              Manage your account and application preferences.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {sections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <Card>
                <CardContent className="p-0">
                  {section.items.map((item, index) => (
                    <div key={item.label}>
                      <button
                        onClick={item.action}
                        className="flex w-full items-center justify-between p-4 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-none">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {index < section.items.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ))}
        </div>
      </main>

      {/* Bottom Navigation for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg md:hidden">
        <div className="flex justify-around py-2 max-w-md mx-auto">
          <button onClick={() => router.push("/dashboard")} className="flex flex-col items-center px-4 py-1 text-muted-foreground">
            <span>🏠</span><span className="text-[10px]">Home</span>
          </button>
          <button onClick={() => router.push("/tasks")} className="flex flex-col items-center px-4 py-1 text-muted-foreground">
            <span>✅</span><span className="text-[10px]">Tasks</span>
          </button>
          <button onClick={() => router.push("/reports")} className="flex flex-col items-center px-4 py-1 text-muted-foreground">
            <span>📊</span><span className="text-[10px]">Reports</span>
          </button>
          <button className="flex flex-col items-center px-4 py-1 text-primary font-medium">
            <Settings className="h-5 w-5" /><span className="text-[10px]">Settings</span>
          </button>
        </div>
      </div>
    </div>
  )
}
