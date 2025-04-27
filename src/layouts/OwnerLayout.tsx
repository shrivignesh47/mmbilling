
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import OwnerSidebar from "@/components/dashboards/owner/OwnerSidebar";
import { withAuth } from "@/contexts/AuthContext";

const OwnerLayout: React.FC = () => {
  return (
    <MainLayout sidebarContent={<OwnerSidebar />} />
  );
};

// Protect this layout with authentication and owner role requirement
export default withAuth(OwnerLayout, "owner");
