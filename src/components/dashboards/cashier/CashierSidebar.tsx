
import React from "react";
import { NavLink } from "react-router-dom";
import { BarChart3, Calculator, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

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

interface CashierSidebarProps {
  collapsed?: boolean;
}

const CashierSidebar: React.FC<CashierSidebarProps> = ({ collapsed = false }) => {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="space-y-6 flex flex-col h-full">
      {!collapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-1 text-lg font-semibold">Cashier Dashboard</h2>
        </div>
      )}
      
      <div className="space-y-1 px-1 flex-1">
        <SidebarItem to="/cashier/dashboard" icon={BarChart3} end collapsed={collapsed}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/cashier/billing" icon={Calculator} collapsed={collapsed}>
          Billing
        </SidebarItem>
        <SidebarItem to="/cashier/settings" icon={Settings} collapsed={collapsed}>
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

export default CashierSidebar;
