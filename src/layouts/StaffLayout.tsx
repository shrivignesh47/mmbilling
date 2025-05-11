
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import StaffSidebar from "@/components/dashboards/staff/StaffSidebar";
import { withAuth } from "@/contexts/auth";
import { useAuth } from "@/contexts/auth";

const StaffLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile } = useAuth();
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <MainLayout 
      sidebarContent={<StaffSidebar collapsed={sidebarCollapsed} />} 
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
      shopName={profile?.shop_name}
    />
  );
};

// Protect this layout with authentication and staff role requirement
export default withAuth(StaffLayout, "staff");
