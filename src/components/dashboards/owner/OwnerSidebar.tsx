
import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Building2,
  LogOut,
  Settings,
  Users,
  ShieldCheck,
  Bell,
} from "lucide-react";
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
        className="sidebar-item w-full text-left flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-muted transition-colors"
      >
        <Icon size={20} className="flex-shrink-0" />
        {!collapsed && <span className="ml-3 truncate">{children}</span>}
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "sidebar-item flex items-center py-2 px-3 text-sm font-medium rounded-md hover:bg-muted transition-colors",
          isActive ? "bg-muted text-primary" : "text-muted-foreground"
        )
      }
    >
      <Icon size={20} className="flex-shrink-0" />
      {!collapsed && <span className="ml-3 truncate">{children}</span>}
    </NavLink>
  );
};

interface OwnerSidebarProps {
  collapsed?: boolean;
}

const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ collapsed = false }) => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      {!collapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-1 text-lg font-semibold">Owner Dashboard</h2>
        </div>
      )}
      
      <div className="space-y-1 px-1 flex-1">
        <SidebarItem to="/owner/dashboard" icon={BarChart3} end collapsed={collapsed}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/owner/shops" icon={Building2} collapsed={collapsed}>
          Shops
        </SidebarItem>
        <SidebarItem to="/owner/users" icon={Users} collapsed={collapsed}>
          Users
        </SidebarItem>
        <SidebarItem to="/owner/roles" icon={ShieldCheck} collapsed={collapsed}>
          Roles & Permissions
        </SidebarItem>
        <SidebarItem to="/owner/notifications" icon={Bell} collapsed={collapsed}>
          Notifications
        </SidebarItem>
        <SidebarItem to="/owner/settings" icon={Settings} collapsed={collapsed}>
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

export default OwnerSidebar;
