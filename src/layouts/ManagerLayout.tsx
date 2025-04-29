
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ManagerSidebar from "@/components/dashboards/manager/ManagerSidebar";
import { withAuth } from "@/contexts/AuthContext";

const ManagerLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <MainLayout 
      sidebarContent={<ManagerSidebar collapsed={sidebarCollapsed} />} 
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
    />
  );
};

// Protect this layout with authentication and manager role requirement
export default withAuth(ManagerLayout, "manager");
