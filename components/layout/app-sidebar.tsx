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
  FolderKanban,
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
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen } = useSidebar();

  const userRole = (session?.user as any)?.role || 'Team Member';
  const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager';

  const navigate = (url: string) => {
    router.push(url);
    setOpen(false); // Auto-close sidebar on click
  };

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
      title: 'Projects',
      icon: FolderKanban,
      url: '/projects',
    }] : []),
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
    <Sidebar collapsible="offcanvas" className="bg-[#090a11] border-r border-white/5">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-white/5">
        <SidebarTrigger className="h-10 w-10 text-white/50 hover:text-teal-400 hover:bg-teal-500/10 rounded-xl transition-all -ml-1" />
      </SidebarHeader>
      <SidebarContent className="px-3 py-10 gap-6 custom-scrollbar">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold px-3 mb-3 uppercase tracking-[0.2em] text-white/30">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => navigate(item.url)}
                    className={cn(
                      "h-12 px-3 rounded-xl transition-all duration-200 group/btn",
                      pathname === item.url
                        ? "bg-teal-500/10 text-teal-400 font-bold border border-teal-500/10"
                        : "hover:bg-white/5 text-white/60 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110",
                      pathname === item.url ? "text-teal-400" : "text-white/40"
                    )} />
                    <span className="ml-2 text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminOrManager && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold px-3 mb-3 uppercase tracking-[0.2em] text-white/30">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => navigate(item.url)}
                      className={cn(
                        "h-12 px-3 rounded-xl transition-all duration-200 group/btn",
                        pathname === item.url
                          ? "bg-teal-500/10 text-teal-400 font-bold border border-teal-500/10"
                          : "hover:bg-white/5 text-white/60 hover:text-white"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110",
                        pathname === item.url ? "text-teal-400" : "text-white/40"
                      )} />
                      <span className="ml-2 text-base">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] font-bold px-3 mb-3 uppercase tracking-[0.2em] text-white/30">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => navigate(item.url)}
                    className={cn(
                      "h-12 px-3 rounded-xl transition-all duration-200 group/btn",
                      pathname === item.url
                        ? "bg-teal-500/10 text-teal-400 font-bold border border-teal-500/10"
                        : "hover:bg-white/5 text-white/60 hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 transition-transform duration-300 group-hover/btn:scale-110",
                      pathname === item.url ? "text-teal-400" : "text-white/40"
                    )} />
                    <span className="ml-2 text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full h-14 flex items-center justify-between hover:bg-white/5 rounded-2xl px-3 transition-all duration-300 border border-transparent hover:border-white/5"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9 border-2 border-teal-500/20 shadow-[0_0_10px_rgba(45,212,191,0.1)]">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-teal-500/10 text-teal-400 text-xs font-bold">
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#090a11] rounded-full" />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-bold text-white truncate max-w-[120px]">
                    {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[11px] text-teal-500/60 font-bold uppercase tracking-wider">
                    {userRole}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white/20 group-hover:translate-x-0.5 transition-transform" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('last_notification_time');
                  sessionStorage.clear();
                }
                await signOut({ callbackUrl: '/login' });
              }}
              className="w-full h-11 px-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl transition-all duration-300 border border-transparent hover:border-rose-500/10"
              tooltip="Sign Out"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-bold text-sm tracking-wide">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}