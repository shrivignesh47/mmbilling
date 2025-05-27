import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Bell,
  FileText,
  Truck,
  ClipboardList,
  UserCog,
  User,
  FileBarChart,
  Repeat,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Warehouse,
  AlertTriangle,
  Receipt,
  UserCheck,
  UserPlus
} from "lucide-react";

interface ManagerSidebarProps {
  collapsed: boolean;
}

const sidebarGroups = [
  {
    title: "Inventory",
    icon: <Warehouse className="h-5 w-5" />,
    links: [
      {
        title: "Purchase Entry",
        href: "/manager/PurchaseEntry",
        icon: <ClipboardList className="h-5 w-5" />,
      },
      {
        title: "Purchase Inventory",
        href: "/manager/PurchaseInventory",
        icon: <Truck className="h-5 w-5" />,
      },
      {
        title: "Inventory",
        href: "/manager/inventory",
        icon: <Warehouse className="h-5 w-5" />,
      },
      {
        title: "Damaged Inventory",
        href: "/manager/DamagedInventory",
        icon: <AlertTriangle className="h-5 w-5" />,
      },
      {
        title: "Products",
        href: "/manager/products",
        icon: <ShoppingBag className="h-5 w-5" />,
      },
      {
        title: "Supplier",
        href: "/manager/Supplier",
        icon: <Truck className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Sales",
    icon: <Receipt className="h-5 w-5" />,
    links: [
      {
        title: "Invoice Generator",
        href: "/manager/PurchaseInvoice",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: "Billing",
        href: "/manager/billing",
        icon: <CreditCard className="h-5 w-5" />,
      },
      {
        title: "Transactions",
        href: "/manager/Transactions",
        icon: <FileBarChart className="h-5 w-5" />,
      },
      {
        title: "SalesReport",
        href: "/manager/SalesReport",
        icon: <FileBarChart className="h-5 w-5" />,
      },
      {
        title: "Return",
        href: "/manager/return",
        icon: <Repeat className="h-5 w-5" />,
      },
      {
        title: "Customers",
        href: "/manager/customers",
        icon: <User className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "People",
    icon: <Users className="h-5 w-5" />, // Use Users icon for People
    links: [
      {
        title: "Staff",
        href: "/manager/staff",
        icon: <UserCheck className="h-5 w-5" />,
      },
      {
        title: "Cashier Activity",
        href: "/manager/cashiers",
        icon: <UserPlus className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Settings",
    icon: <Settings className="h-5 w-5" />,
    links: [
      {
        title: "Settings",
        href: "/manager/settings",
        icon: <Settings className="h-5 w-5" />,
      },
      {
        title: "Notifications",
        href: "/manager/notifications",
        icon: <Bell className="h-5 w-5" />,
      },
    ],
  },
];

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({ collapsed }) => {
  const [openGroups, setOpenGroups] = useState<{ [key: string]: boolean }>({});

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className={cn("flex-1 py-6 space-y-1", collapsed ? "px-2" : "px-4")}>
        {/* Standalone Dashboard link */}
        <NavLink
          to="/manager/dashboard"
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
          <LayoutDashboard className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Dashboard</span>}
        </NavLink>
        {/* Grouped links */}
        {sidebarGroups.map((group) => (
          <div key={group.title}>
            <button
              type="button"
              className={cn(
                "flex items-center w-full py-2 px-3 rounded-md text-sm font-semibold transition-colors focus:outline-none",
                "hover:bg-muted",
                collapsed ? "justify-center" : ""
              )}
              onClick={() => toggleGroup(group.title)}
            >
              {group.icon}
              {!collapsed && (
                <>
                  <span className="ml-3 flex-1 text-left">{group.title}</span>
                  {group.links.length > 1 && (
                    openGroups[group.title] ? (
                      <ChevronDown className="w-4 h-4 ml-auto" />
                    ) : (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )
                  )}
                </>
              )}
            </button>
            {/* Dropdown links */}
            {(openGroups[group.title] || collapsed || group.links.length === 1) && (
              <div className={cn("pl-7", collapsed ? "pl-0" : "")}>
                {group.links.map((link) => (
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
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerSidebar;