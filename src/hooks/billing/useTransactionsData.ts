
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction, TransactionResponse } from "@/components/billing/types";
import { parseTransactionItems } from "@/components/utils/BillingUtils";

export const useTransactionsData = (profile: any) => {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Fetch transactions on mount or when profile changes
  useEffect(() => {
    if (profile?.shop_id) {
      fetchRecentTransactions();
    }
  }, [profile?.shop_id]);

  const fetchRecentTransactions = async () => {
    if (!profile?.shop_id) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        // Type safety for the returned data
        const typedTransactions: Transaction[] = data.map((transaction: TransactionResponse) => ({
          id: transaction.id,
          transaction_id: transaction.transaction_id,
          created_at: transaction.created_at,
          amount: transaction.amount,
          items: parseTransactionItems(transaction.items),
          payment_method: transaction.payment_method,
          payment_details: transaction.payment_details || { method: transaction.payment_method } // Add default method value
        }));
        
        setRecentTransactions(typedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  return {
    recentTransactions,
    fetchRecentTransactions
  };
};
