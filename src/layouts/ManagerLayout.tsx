
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ManagerSidebar from "@/components/dashboards/manager/ManagerSidebar";
import { withAuth } from "@/contexts/AuthContext";

const ManagerLayout: React.FC = () => {
  return (
    <MainLayout sidebarContent={<ManagerSidebar />} />
  );
};

// Protect this layout with authentication and manager role requirement
export default withAuth(ManagerLayout, "manager");
