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
    <Sidebar collapsible="icon" className="border-r border-gray-800 bg-[#090a11]">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
            <CheckSquare className="h-5 w-5 text-teal-400" />
          </div>
          <span className="font-bold text-teal-400 truncate group-data-[collapsible=icon]:hidden">
            Can shift
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-500 group-data-[collapsible=icon]:hidden">Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "hover:bg-teal-500/10 hover:text-teal-400 transition-colors",
                      pathname === item.url && "bg-teal-500/10 text-teal-400"
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
            <SidebarGroupLabel className="text-gray-500 group-data-[collapsible=icon]:hidden">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => router.push(item.url)}
                      tooltip={item.title}
                      className={cn(
                        "hover:bg-teal-500/10 hover:text-teal-400 transition-colors",
                        pathname === item.url && "bg-teal-500/10 text-teal-400"
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
          <SidebarGroupLabel className="text-gray-500 group-data-[collapsible=icon]:hidden">Preferences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                    className={cn(
                      "hover:bg-teal-500/10 hover:text-teal-400 transition-colors",
                      pathname === item.url && "bg-teal-500/10 text-teal-400"
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

      <SidebarFooter className="border-t border-gray-800/50 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full flex items-center justify-between group-data-[collapsible=icon]:p-0"
              onClick={() => router.push('/settings')}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-teal-500/30">
                  <AvatarImage src={session?.user?.image || ''} />
                  <AvatarFallback className="bg-teal-900/50 text-teal-400 text-xs">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">
                    {session?.user?.name}
                  </span>
                  <span className="text-[10px] text-gray-500 truncate max-w-[100px]">
                    {userRole}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-500 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: '/login' })}
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
