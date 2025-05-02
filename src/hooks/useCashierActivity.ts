
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CashierActivity {
  id: string;
  name: string | null;
  email: string | null;
  transactionCount: number;
  totalSales: number;
  lastActive: string | null;
  // Adding these properties to match the expected type in CashierActivity component
  last_login: string | null;
  last_logout: string | null;
  daily_sales: number;
  daily_transactions: number;
}

export const useCashierActivity = (shopId: string | undefined) => {
  const [cashiers, setCashiers] = useState<CashierActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shopId) {
      fetchCashierActivity();
    }
  }, [shopId]);

  const fetchCashierActivity = async () => {
    if (!shopId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Get all cashiers for this shop
      const { data: cashiersData, error: cashiersError } = await supabase
        .from("profiles")
        .select("id, name, email")
        .eq("shop_id", shopId)
        .eq("role", "cashier");

      if (cashiersError) throw cashiersError;

      if (!cashiersData || cashiersData.length === 0) {
        setCashiers([]);
        setLoading(false);
        return;
      }

      // 2. Format the cashier data - simplifying to avoid deep type instantiations
      const formattedCashiers: CashierActivity[] = await Promise.all(
        cashiersData.map(async (cashier) => {
          // Get transaction count for this cashier - using simpler approach
          const { count, error: countError } = await supabase
            .from("transactions")
            .select("id", { count: "exact", head: true })
            .eq("cashier_id", cashier.id);

          const transactionCount = countError ? 0 : (count || 0);

          // Get total sales for this cashier - using simpler approach
          const { data: salesData, error: salesError } = await supabase
            .from("transactions")
            .select("amount")
            .eq("cashier_id", cashier.id);

          let totalSales = 0;
          if (!salesError && salesData) {
            totalSales = salesData.reduce((sum, tx) => sum + (typeof tx.amount === 'number' ? tx.amount : 0), 0);
          }

          // Get last active timestamp
          const { data: latestTx, error: latestError } = await supabase
            .from("transactions")
            .select("created_at")
            .eq("cashier_id", cashier.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastActive = latestTx && latestTx.length > 0 ? latestTx[0].created_at : null;

          return {
            id: cashier.id,
            name: cashier.name || "Unknown",
            email: cashier.email || "",
            transactionCount,
            totalSales,
            lastActive,
            // These additional fields make it compatible with the CashierActivity component
            last_login: lastActive, // Using lastActive as a substitute for login
            last_logout: null,     // No logout data available
            daily_sales: totalSales,
            daily_transactions: transactionCount
          };
        })
      );

      setCashiers(formattedCashiers);
    } catch (err) {
      console.error("Error fetching cashier activity:", err);
      setError("Failed to load cashier activity data");
    } finally {
      setLoading(false);
    }
  };

  return { 
    cashiers, 
    loading, 
    error, 
    fetchCashierActivity,
    // Add isLoading as an alias for loading to fix the compatibility issue
    isLoading: loading 
  };
};
