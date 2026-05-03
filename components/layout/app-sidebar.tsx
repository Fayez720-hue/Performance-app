'use client';

import * as React from 'react';
import {
  BarChart3,
  CheckSquare,
  Clock,
  LayoutGrid,
  Settings,
  User,
  Users,
  LogOut,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// ❌ Remove this line – it's the cause of the build error
// import './globals.css';

export function AppSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const userRole = (session?.user as any)?.role || 'Team Member';
  const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager';

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutGrid,
      url: '/dashboard',
    },
    {
      title: 'Tasks',
      icon: CheckSquare,
      url: '/tasks',
    },
    ...(isAdminOrManager ? [{
      title: 'Reports',
      icon: BarChart3,
      url: '/reports',
    }] : []),
    {
      title: 'Attendance',
      icon: Clock,
      url: '/clock-in',
    },
  ];

  const adminItems = [
    {
      title: 'Users',
      icon: Users,
      url: '/admin/users',
    },
  ];

  const settingsItems = [
    {
      title: 'Settings',
      icon: Settings,
      url: '/settings',
    },
  ];

  return (
    <Sidebar variant="inset" collapsible="icon" className="bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 shadow-sm border border-teal-500/20">
            <ClipboardList className="h-5 w-5 text-teal-400" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-foreground tracking-tight">Can shift</span>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Performance</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4 gap-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold px-2 mb-2 uppercase tracking-widest text-muted-foreground/50 group-data-[collapsible=icon]:hidden">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "h-10 px-3 rounded-lg transition-all duration-200",
                      pathname === item.url
                        ? "bg-teal-500/10 text-teal-400 font-medium"
                        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5", pathname === item.url ? "text-teal-400" : "text-muted-foreground")} />
                    <span className="ml-1">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminOrManager && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold px-2 mb-2 uppercase tracking-widest text-muted-foreground/50 group-data-[collapsible=icon]:hidden">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => router.push(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "h-10 px-3 rounded-lg transition-all duration-200",
                        pathname === item.url
                          ? "bg-teal-500/10 text-teal-400 font-medium"
                          : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className={cn("h-4.5 w-4.5", pathname === item.url ? "text-teal-400" : "text-muted-foreground")} />
                      <span className="ml-1">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-semibold px-2 mb-2 uppercase tracking-widest text-muted-foreground/50 group-data-[collapsible=icon]:hidden">
            Preferences
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "h-10 px-3 rounded-lg transition-all duration-200",
                      pathname === item.url
                        ? "bg-teal-500/10 text-teal-400 font-medium"
                        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("h-4.5 w-4.5", pathname === item.url ? "text-teal-400" : "text-muted-foreground")} />
                    <span className="ml-1">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full flex items-center justify-between group-data-[collapsible=icon]:p-0 hover:bg-accent/50 rounded-xl px-2 transition-all"
              onClick={() => router.push('/settings')}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-teal-500/20 shadow-sm">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-teal-500/10 text-teal-400 text-xs font-bold">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="text-sm font-bold text-foreground truncate max-w-[120px]">
                    {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
                    {userRole}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden opacity-50" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-2">
            <SidebarMenuButton
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('last_notification_time');
                  sessionStorage.clear();
                }
                await signOut({ callbackUrl: '/login' });
              }}
              className="w-full h-10 px-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all"
              tooltip="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}