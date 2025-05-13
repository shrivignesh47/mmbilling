
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Bell
} from "lucide-react";

interface ManagerSidebarProps {
  collapsed: boolean;
}

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ collapsed }) => {
  const sidebarLinks = [
    {
      title: "Dashboard",
      href: "/manager/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Inventory",
      href: "/manager/inventory",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/manager/products",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Staff",
      href: "/manager/staff",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Cashier Activity",
      href: "/manager/cashiers", // Updated to point to the Cashiers page
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Notifications",
      href: "/manager/notifications",
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/manager/settings",
      icon: <Settings className="h-5 w-5" />,
    }

  ];

  return (
    <div className="flex flex-col h-full">
      <div className={cn("flex-1 py-6 space-y-1", collapsed ? "px-2" : "px-4")}>
        {sidebarLinks.map((link) => (
          <NavLink
            key={link.href}
            to={link.href}
            className={({ isActive }) =>
              cn(
                "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                collapsed ? "justify-center" : ""
              )
            }
          >
            {link.icon}
            {!collapsed && <span className="ml-3">{link.title}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default ManagerSidebar;
