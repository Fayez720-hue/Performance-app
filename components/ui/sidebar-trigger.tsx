"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export { SidebarTrigger } from "./sidebar-trigger";
  const { open, setOpen } = useSidebar();
const [sidebarInitialized, setSidebarInitialized] = React.useState(false);

// Collapse sidebar on first load
React.useEffect(() => {
  if (!sidebarInitialized && open) {
    setOpen(false);
    setSidebarInitialized(true);
  }
}, [open, sidebarInitialized, setOpen]);
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={() => setOpen(!open)}
      className="h-10 w-10 text-white/50 hover:text-teal-400 hover:bg-teal-500/10 rounded-xl transition-all"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}