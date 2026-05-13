'use client';

import * as React from 'react';
import {
  BarChart3,
  CheckSquare,
  Clock,
  LayoutGrid,
  Settings,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  ClipboardList,
  FolderKanban,
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import useSWR from 'swr';

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
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';
import { SidebarToggle } from './sidebar-toggle';

export function AppSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { open } = useSidebar();
  const [isTasksExpanded, setIsTasksExpanded] = React.useState(true);
  const [reviewCount, setReviewCount] = React.useState(0);

  const userRole = (session?.user as any)?.role || 'Team Member';
  const isAdminOrManager = userRole === 'Admin' || userRole === 'Manager';

  // Fetch tasks to get review count
  const { data: tasks } = useSWR<Task[]>(
    session?.user ? '/api/tasks' : null,
    async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    },
    {
      refreshInterval: 30000,
      onSuccess: (data) => {
        if (Array.isArray(data)) {
          const count = data.filter((task: Task) => task.progress === 'Review').length;
          setReviewCount(count);
        }
      }
    }
  );

  const navigate = (url: string) => {
    router.push(url);
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
      hasSubItems: true,
      subItems: [
        {
          title: 'All Tasks',
          icon: ClipboardList,
          url: '/tasks',
        },
        ...(isAdminOrManager ? [{
          title: 'Review',
          icon: ClipboardList,
          url: '/tasks?filter=review&status=REVIEW',
          badge: reviewCount,
        }] : []),
      ],
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
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <SidebarToggle />
      </SidebarHeader>
      <SidebarContent className="px-3 py-10 gap-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-bold px-3 mb-3 uppercase tracking-[0.2em] text-sidebar-foreground/30">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => (
                <React.Fragment key={item.title}>
                  {item.hasSubItems ? (
                    <>
                      {/* Tasks Main Button with Expand/Collapse */}
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                          className="h-12 px-3 rounded-xl transition-all duration-200 group/btn w-full justify-between text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className="h-5 w-5 text-sidebar-foreground/60" />
                            <span className="text-base">{item.title}</span>
                          </div>
                          {isTasksExpanded ? (
                            <ChevronDown className="h-4 w-4 text-sidebar-foreground/40" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-sidebar-foreground/40" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                      
                      {/* Sub-items (All Tasks & Review) */}
                      {isTasksExpanded && item.subItems && (
                        <div className="ml-6 space-y-1">
                          {item.subItems.map((subItem) => (
                            <SidebarMenuItem key={subItem.title}>
                              <SidebarMenuButton
                                onClick={() => navigate(subItem.url)}
                                isActive={pathname === subItem.url.split('?')[0] && !subItem.url.includes('?')}
                                className="h-10 px-3 rounded-xl transition-all duration-200 group/btn w-full justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <subItem.icon className="h-4 w-4" />
                                  <span className="text-sm">{subItem.title}</span>
                                </div>
                                {subItem.badge !== undefined && subItem.badge > 0 && (
                                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                                    {subItem.badge > 99 ? '99+' : subItem.badge}
                                  </span>
                                )}
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={pathname === item.url}
                        onClick={() => navigate(item.url)}
                        className="h-12 px-3 rounded-xl transition-all duration-200 group/btn text-sidebar-foreground hover:bg-sidebar-accent"
                      >
                        <item.icon className="h-5 w-5 text-sidebar-foreground/60" />
                        <span className="ml-2 text-base">{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </React.Fragment>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdminOrManager && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-bold px-3 mb-3 uppercase tracking-[0.2em] text-sidebar-foreground/30">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={() => navigate(item.url)}
                      className="h-12 px-3 rounded-xl transition-all duration-200 group/btn text-sidebar-foreground hover:bg-sidebar-accent"
                    >
                      <item.icon className="h-5 w-5 text-sidebar-foreground/60" />
                      <span className="ml-2 text-base">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-[10px] font-bold px-3 mb-3 uppercase tracking-[0.2em] text-sidebar-foreground/30">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => navigate(item.url)}
                    className="h-12 px-3 rounded-xl transition-all duration-200 group/btn text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <item.icon className="h-5 w-5 text-sidebar-foreground/60" />
                    <span className="ml-2 text-base">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <SidebarMenu className="gap-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="w-full h-14 flex items-center justify-between hover:bg-sidebar-accent rounded-2xl px-3 transition-all duration-300 text-sidebar-foreground"
              onClick={() => navigate('/settings')}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarImage src={session?.user?.image || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                </div>
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-sm font-bold truncate max-w-[120px]">
                    {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
                  </span>
                  <span className="text-[11px] text-primary/60 font-bold uppercase tracking-wider">
                    {userRole}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-sidebar-foreground/20" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={async () => {
                await signOut({ callbackUrl: '/login' });
              }}
              className="w-full h-11 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
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