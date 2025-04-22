import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Building,
  Package,
  Settings,
  UserCheck,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div
      className={cn(
        "relative h-screen bg-sidebar border-r border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[80px]" : "w-[280px]",
        className
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div
          className={cn(
            "flex items-center",
            collapsed && "justify-center w-full"
          )}
        >
          {!collapsed && (
            <span className="text-xl font-bold text-sidebar-foreground">
              <span className="text-primary">AAZOVO</span>
            </span>
          )}
          {collapsed && <Package className="h-6 w-6 text-primary" />}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute -right-3 top-6 bg-primary text-primary-foreground rounded-full h-6 w-6 p-1 z-10",
            collapsed && "rotate-180"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <Separator className="my-2" />

      <div className="px-3 py-2">
        <nav className="space-y-1">
          <NavItem
            to="/"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            collapsed={collapsed}
          />

          <Separator className="my-2 bg-sidebar-border/50" />

          <div
            className={cn(
              "text-xs text-sidebar-foreground/70 font-medium mb-2 mt-4",
              collapsed ? "text-center" : "px-3"
            )}
          >
            {!collapsed && "USER MANAGEMENT"}
            {collapsed && "USERS"}
          </div>

          <NavItem
            to="/buyers"
            icon={<Users className="h-5 w-5" />}
            label="Buyers"
            collapsed={collapsed}
          />
          <NavItem
            to="/suppliers"
            icon={<Users className="h-5 w-5" />}
            label="Suppliers"
            collapsed={collapsed}
          />
          <NavItem
            to="/companies"
            icon={<Building className="h-5 w-5" />}
            label="Companies"
            collapsed={collapsed}
          />
          <NavItem
            to="/partners"
            icon={<Users className="h-5 w-5" />}
            label="Partners"
            collapsed={collapsed}
          />

          <Separator className="my-2 bg-sidebar-border/50" />

          <div
            className={cn(
              "text-xs text-sidebar-foreground/70 font-medium mb-2 mt-4",
              collapsed ? "text-center" : "px-3"
            )}
          >
            {!collapsed && "VERIFICATION"}
            {collapsed && "KYC"}
          </div>

          <NavItem
            to="/kyc"
            icon={<UserCheck className="h-5 w-5" />}
            label="KYC Verification"
            collapsed={collapsed}
          />

          <Separator className="my-2 bg-sidebar-border/50" />

          <div
            className={cn(
              "text-xs text-sidebar-foreground/70 font-medium mb-2 mt-4",
              collapsed ? "text-center" : "px-3"
            )}
          >
            {!collapsed && "MARKETPLACE"}
            {collapsed && "MARKET"}
          </div>

          <NavItem
            to="/demands"
            icon={<Bell className="h-5 w-5" />}
            label="Product Demands"
            collapsed={collapsed}
          />
          <NavItem
            to="/offers"
            icon={<Package className="h-5 w-5" />}
            label="Product Offers"
            collapsed={collapsed}
          />

          <div className="absolute bottom-8 w-full px-3">
            <Separator className="my-2 bg-sidebar-border/50" />

            <NavItem
              to="/settings"
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              collapsed={collapsed}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function NavItem({ to, icon, label, collapsed }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground",
          collapsed && "justify-center px-2"
        )
      }
      end={to === "/"}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
