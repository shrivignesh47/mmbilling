
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSalesData = (profile: any) => {
  const [dailySaleCount, setDailySaleCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);

  // Fetch sales data on mount or when profile changes
  useEffect(() => {
    if (profile?.shop_id) {
      fetchDailySaleCount();
      fetchDailyRevenue();
    }
  }, [profile?.shop_id]);

  const fetchDailySaleCount = async () => {
    try {
      if (!profile?.shop_id) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: false })
        .eq('shop_id', profile.shop_id)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      setDailySaleCount(count || 0);
    } catch (error) {
      console.error('Error fetching daily sale count:', error);
      setDailySaleCount(0);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      if (!profile?.shop_id) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('shop_id', profile.shop_id)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      if (Array.isArray(data)) {
        const totalAmount = data.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        setDailyRevenue(totalAmount);
      } else {
        setDailyRevenue(0);
        console.warn("Daily revenue data returned an unexpected type:", data);
      }
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      setDailyRevenue(0);
    }
  };

  return {
    dailySaleCount,
    dailyRevenue,
    fetchDailySaleCount,
    fetchDailyRevenue
  };
};
