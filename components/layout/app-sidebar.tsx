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
    {
      title: isAdminOrManager ? 'Reports' : 'Analytics',
      icon: BarChart3,
      url: '/reports',
    },
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
    <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-primary truncate group-data-[collapsible=icon]:hidden">
            Can shift
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground group-data-[collapsible=icon]:hidden">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-colors",
                      pathname === item.url && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminOrManager && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground group-data-[collapsible=icon]:hidden">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => router.push(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "hover:bg-primary/10 hover:text-primary transition-colors",
                        pathname === item.url && "bg-primary/10 text-primary"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground group-data-[collapsible=icon]:hidden">Preferences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "hover:bg-primary/10 hover:text-primary transition-colors",
                      pathname === item.url && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full flex items-center justify-between group-data-[collapsible=icon]:p-0"
              onClick={() => router.push('/settings')}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-primary/30">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="text-xs font-bold text-foreground truncate max-w-[100px]">
                    {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                    {userRole}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                // Clear any potential local state before signing out
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('last_notification_time');
                  sessionStorage.clear();
                }
                await signOut({ callbackUrl: '/login' });
              }}
              className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
              tooltip="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
