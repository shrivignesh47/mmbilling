
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ShopDetails } from "@/components/billing/types";

export const useShopDetails = (profile: any) => {
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);

  // Fetch shop details on mount or when profile changes
  useEffect(() => {
    if (profile?.shop_id) {
      fetchShopDetails();
    }
  }, [profile?.shop_id]);

  const fetchShopDetails = async () => {
    try {
      if (!profile?.shop_id) return;
      
      const { data, error } = await supabase
        .from('shops')
        .select('name, address')
        .eq('id', profile.shop_id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setShopDetails({
          name: data.name,
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
    }
  };

  return {
    shopDetails,
    fetchShopDetails
  };
};
