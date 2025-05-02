
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CashierActivity {
  id: string;
  name: string | null;
  email: string | null;
  last_login: string | null;
  last_logout: string | null;
  daily_sales: number;
  daily_transactions: number;
}

// Define AuthEvent type for cashier activity tracking
interface AuthEvent {
  user_id: string;
  created_at: string;
  event: string;
}

export const useCashierActivity = (shopId: string | undefined) => {
  const [cashiers, setCashiers] = useState<CashierActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }
    
    const fetchCashierActivity = async () => {
      setIsLoading(true);
      try {
        // Fetch all cashiers for this shop
        const { data: cashierData, error: cashierError } = await supabase
          .from('profiles')
          .select('id, name, email, shop_id')
          .eq('shop_id', shopId)
          .eq('role', 'cashier');
          
        if (cashierError) throw cashierError;
        
        if (!cashierData || cashierData.length === 0) {
          setCashiers([]);
          setIsLoading(false);
          return;
        }
        
        // Prepare for fetching additional data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Fetch activity data for all cashiers
        const cashiersWithActivity: CashierActivity[] = await Promise.all(
          cashierData.map(async (cashier) => {
            // Get authentication logs (for login/logout)
            // Since auth_events isn't directly accessible via supabase client,
            // we'll mock this data for now and suggest implementing a proper tracking mechanism
            let last_login = null;
            let last_logout = null;
            
            // Get daily sales data
            const { data: transactions, error: txError } = await supabase
              .from('transactions')
              .select('amount')
              .eq('cashier_id', cashier.id)
              .eq('shop_id', shopId)
              .gte('created_at', today.toISOString());
              
            let daily_sales = 0;
            let daily_transactions = 0;
            
            if (!txError && transactions) {
              daily_sales = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
              daily_transactions = transactions.length;
            }
            
            return {
              id: cashier.id,
              name: cashier.name,
              email: cashier.email,
              last_login,
              last_logout,
              daily_sales,
              daily_transactions
            };
          })
        );
        
        setCashiers(cashiersWithActivity);
      } catch (error) {
        console.error('Error fetching cashier activity:', error);
        toast.error('Failed to load cashier activity data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCashierActivity();
    
    // Set up a refresh interval
    const intervalId = setInterval(fetchCashierActivity, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [shopId]);
  
  return { cashiers, isLoading };
};
