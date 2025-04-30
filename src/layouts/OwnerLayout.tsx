
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import OwnerSidebar from "@/components/dashboards/owner/OwnerSidebar";
import { withAuth } from "@/contexts/auth";

const OwnerLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <MainLayout 
      sidebarContent={<OwnerSidebar collapsed={sidebarCollapsed} />} 
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
    />
  );
};

// Protect this layout with authentication and owner role requirement
export default withAuth(OwnerLayout, "owner");
