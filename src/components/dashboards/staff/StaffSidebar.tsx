
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface StaffSidebarProps {
  collapsed: boolean;
}

const StaffSidebar: React.FC<StaffSidebarProps> = ({ collapsed }) => {
  const navItems = [
    { icon: Home, label: "Dashboard", href: "/staff/dashboard" },
    { icon: Settings, label: "Settings", href: "/staff/settings" }
  ];

  return (
    <div className="h-full flex flex-col py-2">
      <div className="mb-8 pl-3 pr-6">
        {!collapsed && (
          <h3 className="font-medium text-lg mb-1">Staff Portal</h3>
        )}
      </div>

      <div className="space-y-1 px-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center py-2 px-3 text-sm rounded-md transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground",
                collapsed ? "justify-center" : ""
              )
            }
          >
            <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto px-2">
        <NavLink
          to="/staff/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center py-2 px-3 text-sm rounded-md transition-colors",
              isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-muted text-muted-foreground",
              collapsed ? "justify-center" : ""
            )
          }
        >
          <Settings className={cn("h-5 w-5", collapsed ? "" : "mr-2")} />
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default StaffSidebar;
