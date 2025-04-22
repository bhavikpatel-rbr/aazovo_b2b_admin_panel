
import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  className?: string;
}

export function AppLayout({ className }: AppLayoutProps) {
  return (
    <TooltipProvider>
      <div className="h-screen w-full bg-background flex overflow-hidden dark">
        <Sidebar />
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6", className)}>
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
}
