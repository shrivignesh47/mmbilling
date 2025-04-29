
import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import CashierSidebar from "@/components/dashboards/cashier/CashierSidebar";
import { withAuth } from "@/contexts/AuthContext";

const CashierLayout: React.FC = () => {
  return (
    <MainLayout sidebarContent={<CashierSidebar />} />
  );
};

// Protect this layout with authentication and cashier role requirement
export default withAuth(CashierLayout, "cashier");
