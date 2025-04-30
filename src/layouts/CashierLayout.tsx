
import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import CashierSidebar from "@/components/dashboards/cashier/CashierSidebar";
import { withAuth } from "@/contexts/auth";
import { useAuth } from "@/contexts/auth";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const CashierLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile } = useAuth();
  const [shopDetails, setShopDetails] = useState<{ name: string, address: string } | null>(null);
  
  // Fetch shop details on component mount
  useEffect(() => {
    if (profile?.shop_id) {
      fetchShopDetails(profile.shop_id);
    }
  }, [profile?.shop_id]);

  const fetchShopDetails = async (shopId: string) => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('name, address')
        .eq('id', shopId)
        .single();
      
      if (error) {
        console.error('Error fetching shop details:', error);
        return;
      }
      
      if (data) {
        setShopDetails({
          name: data.name,
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch shop details:', error);
    }
  };
  
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <MainLayout 
      sidebarContent={<CashierSidebar collapsed={sidebarCollapsed} />} 
      sidebarCollapsed={sidebarCollapsed}
      toggleSidebar={toggleSidebar}
      shopName={shopDetails?.name}
    />
  );
};

// Protect this layout with authentication and cashier role requirement
export default withAuth(CashierLayout, "cashier");
