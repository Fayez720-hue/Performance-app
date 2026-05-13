"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Context
type SidebarContextType = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Provider
interface SidebarProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarProvider({ children, defaultOpen = false }: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const toggleSidebar = React.useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

// Sidebar Component
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: "offcanvas" | "icon" | "none";
}

export function Sidebar({ className, children, collapsible = "offcanvas", ...props }: SidebarProps) {
  const { open } = useSidebar();
  
  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-full bg-background transition-all duration-300 ease-in-out",
        open ? "w-64" : "w-16",
        className
      )}
      {...props}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

// Sidebar Header
export function SidebarHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center px-4 py-2", className)} {...props} />;
}

// Sidebar Content
export function SidebarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto", className)} {...props} />;
}

// Sidebar Footer
export function SidebarFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto", className)} {...props} />;
}

// Sidebar Group
export function SidebarGroup({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-2", className)} {...props} />;
}

// Sidebar Group Label
export function SidebarGroupLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-3 py-1 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

// Sidebar Group Content
export function SidebarGroupContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

// Sidebar Menu
export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

// Sidebar Menu Item
export function SidebarMenuItem({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-3", className)} {...props} />;
}

// Sidebar Menu Button
interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: "default" | "lg" | "sm";
  tooltip?: string;
}

export function SidebarMenuButton({ 
  className, 
  children, 
  isActive, 
  size = "default",
  tooltip,
  ...props 
}: SidebarMenuButtonProps) {
  return (
    <button
      title={tooltip}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
        size === "lg" && "py-3",
        size === "sm" && "py-1 text-xs",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Sidebar Inset (main content area)
export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useSidebar();
  
  return (
    <div
      className={cn(
        "flex-1 transition-all duration-300",
        open ? "ml-64" : "ml-16",
        className
      )}
      {...props}
    />
  );
}