
import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Receipt,
  Package,
  Settings,
  Users,
  ShoppingBag,
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

interface ManagerSidebarProps {
  collapsed?: boolean;
}

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ collapsed = false }) => {
  return (
    <div className="space-y-6">
      {!collapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-1 text-lg font-semibold">Manager Dashboard</h2>
        </div>
      )}
      
      <div className="space-y-1 px-1">
        <SidebarItem to="/manager/dashboard" icon={BarChart3} end collapsed={collapsed}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/manager/inventory" icon={Package} collapsed={collapsed}>
          Inventory
        </SidebarItem>
        <SidebarItem to="/manager/products" icon={ShoppingBag} collapsed={collapsed}>
          Products
        </SidebarItem>
        <SidebarItem to="/manager/sales" icon={Receipt} collapsed={collapsed}>
          Sales
        </SidebarItem>
        <SidebarItem to="/manager/cashiers" icon={Users} collapsed={collapsed}>
          Cashiers
        </SidebarItem>
        <SidebarItem to="/manager/settings" icon={Settings} collapsed={collapsed}>
          Settings
        </SidebarItem>
      </div>
    </div>
  );
};

export default ManagerSidebar;
