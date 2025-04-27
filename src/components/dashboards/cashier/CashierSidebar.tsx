
import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3,
  CreditCard,
  Receipt,
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

interface CashierSidebarProps {
  collapsed?: boolean;
}

const CashierSidebar: React.FC<CashierSidebarProps> = ({ collapsed = false }) => {
  return (
    <div className="space-y-6">
      {!collapsed && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-1 text-lg font-semibold">Cashier Dashboard</h2>
        </div>
      )}
      
      <div className="space-y-1 px-1">
        <SidebarItem to="/cashier/dashboard" icon={BarChart3} end collapsed={collapsed}>
          Dashboard
        </SidebarItem>
        <SidebarItem to="/cashier/billing" icon={CreditCard} collapsed={collapsed}>
          Billing
        </SidebarItem>
        <SidebarItem to="/cashier/transactions" icon={Receipt} collapsed={collapsed}>
          Transactions
        </SidebarItem>
        <SidebarItem to="/cashier/customers" icon={Users} collapsed={collapsed}>
          Customers
        </SidebarItem>
      </div>
    </div>
  );
};

export default CashierSidebar;
