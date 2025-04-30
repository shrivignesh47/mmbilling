
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CashierSidebar from "@/components/dashboards/cashier/CashierSidebar";
import { withAuth } from "@/contexts/auth";

const CashierLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <MainLayout 
      sidebarContent={<CashierSidebar collapsed={sidebarCollapsed} />} 
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
    />
  );
};

// Protect this layout with authentication and cashier role requirement
export default withAuth(CashierLayout, "cashier");
