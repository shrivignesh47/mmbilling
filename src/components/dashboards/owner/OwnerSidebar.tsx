
import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CreditCard,
  Settings,
  ShoppingBag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  end?: boolean;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon: Icon,
  children,
  end,
  collapsed,
}) => {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn("sidebar-item", isActive && "sidebar-item-active")
      }
    >
      <Icon size={20} />
      {!collapsed && <span>{children}</span>}
    </NavLink>
  );
};

interface OwnerSidebarProps {
  collapsed?: boolean;
}

const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ collapsed = false }) => {
  return (
    <div className="space-y-6">
      {!collapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-1 text-lg font-semibold">Owner Dashboard</h2>
        </div>
      )}
      
      <div className="space-y-1 px-1">
        <SidebarItem to="/owner/dashboard" icon={BarChart3} end collapsed={collapsed}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/owner/shops" icon={Building2} collapsed={collapsed}>
          Shops
        </SidebarItem>
        <SidebarItem to="/owner/users" icon={Users} collapsed={collapsed}>
          Users
        </SidebarItem>
        <SidebarItem to="/owner/subscriptions" icon={CreditCard} collapsed={collapsed}>
          Subscriptions
        </SidebarItem>
        <SidebarItem to="/owner/products" icon={ShoppingBag} collapsed={collapsed}>
          Products
        </SidebarItem>
        <SidebarItem to="/owner/settings" icon={Settings} collapsed={collapsed}>
          Settings
        </SidebarItem>
      </div>
    </div>
  );
};

export default OwnerSidebar;
