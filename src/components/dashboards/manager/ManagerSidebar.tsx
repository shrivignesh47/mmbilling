
import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Package, ShoppingBag, LogOut, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
  end?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  to,
  icon: Icon,
  children,
  end,
  collapsed,
  onClick,
}) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="sidebar-item w-full text-left"
      >
        <Icon size={20} />
        {!collapsed && <span>{children}</span>}
      </button>
    );
  }
  
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
  const { logout, profile } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="space-y-6 flex flex-col h-full">
      {!collapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-1 text-lg font-semibold">Manager Dashboard</h2>
          {profile?.shop_id && (
            <p className="text-xs text-muted-foreground px-1 truncate">
              {profile.shop_name || 'Loading shop...'}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-1 px-1 flex-1">
        <SidebarItem to="/manager/dashboard" icon={BarChart3} end collapsed={collapsed}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/manager/products" icon={ShoppingBag} collapsed={collapsed}>
          Products
        </SidebarItem>
        <SidebarItem to="/manager/inventory" icon={Package} collapsed={collapsed}>
          Inventory
        </SidebarItem>
        <SidebarItem to="/manager/cashiers" icon={Users} collapsed={collapsed}>
          Cashiers
        </SidebarItem>
        <SidebarItem to="/manager/settings" icon={Settings} collapsed={collapsed}>
          Settings
        </SidebarItem>
      </div>
      
      <div className="mt-auto border-t pt-2">
        <SidebarItem to="#" icon={LogOut} collapsed={collapsed} onClick={handleLogout}>
          Logout
        </SidebarItem>
      </div>
    </div>
  );
};

export default ManagerSidebar;
