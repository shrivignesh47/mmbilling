
import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Settings, Package, Clipboard } from "lucide-react"; // Ensure all icons are imported
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth"; // Assuming you have an auth context

interface StaffSidebarProps {
  collapsed: boolean;
}

const StaffSidebar: React.FC<StaffSidebarProps> = ({ collapsed }) => {
  const { profile } = useAuth(); // Access user profile for permissions
  // Log profile to verify permissions

  // Function to check if a user has a specific permission
  const hasPermission = (permission: string) => {
    return profile?.custom_permissions?.includes(permission);
  };

  const navItems = [
    { icon: Home, label: "Dashboard", href: "/staff/dashboard" },
    // { icon: Settings, label: "Settings", href: "/staff/settings" },
    // Conditionally add Inventory and Products items
    ...(profile?.shop_id && hasPermission('view_inventory') ? [{ icon: Clipboard, label: "Inventory", href: "/staff/inventory" }] : []),
    ...(profile?.shop_id && hasPermission('view_products') ? [{ icon: Package, label: "Products", href: "/staff/products" }] : [])
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
            {/* Use the icon as a React component */}
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
