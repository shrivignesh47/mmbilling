
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CashierActivity {
  id: string;
  name: string;
  email: string;
  transactionCount: number;
  totalSales: number;
  lastActive: string | null;
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

      // 2. Format the cashier data with the transaction counts and sales
      const formattedCashiers: CashierActivity[] = await Promise.all(
        cashiersData.map(async (cashier) => {
          // Get transaction count for this cashier
          const { count: transactionCount, error: countError } = await supabase
            .from("transactions")
            .select("*", { count: "exact", head: true })
            .eq("cashier_id", cashier.id);

          if (countError) {
            console.error("Error fetching transaction count:", countError);
            return {
              id: cashier.id,
              name: cashier.name || "Unknown",
              email: cashier.email || "",
              transactionCount: 0,
              totalSales: 0,
              lastActive: null,
            };
          }

          // Get total sales for this cashier
          const { data: salesData, error: salesError } = await supabase
            .from("transactions")
            .select("amount")
            .eq("cashier_id", cashier.id);

          let totalSales = 0;
          if (!salesError && salesData) {
            totalSales = salesData.reduce((sum, tx) => sum + (tx.amount || 0), 0);
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
            transactionCount: transactionCount || 0,
            totalSales,
            lastActive,
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

  return { cashiers, loading, error, fetchCashierActivity };
};
