
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ManagerSidebar from "@/components/dashboards/manager/ManagerSidebar";
import { withAuth } from "@/contexts/auth";
import { useAuth } from "@/contexts/auth";

const ManagerLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <MainLayout 
      sidebarContent={<ManagerSidebar collapsed={sidebarCollapsed} />} 
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
      shopName={profile?.shop_name}
    />
  );
};

// Protect this layout with authentication and manager role requirement
export default withAuth(ManagerLayout, "manager");
