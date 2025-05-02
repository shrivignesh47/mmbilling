
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

type TransactionEvent = {
  created_at: string;
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
            // We'll query the transactions table where we're storing auth events
            const { data: loginEvents, error: loginError } = await supabase
              .from('transactions')
              .select<string, TransactionEvent>('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'login')
              .order('created_at', { ascending: false })
              .limit(1);
              
            const { data: logoutEvents, error: logoutError } = await supabase
              .from('transactions')
              .select<string, TransactionEvent>('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'logout')
              .order('created_at', { ascending: false })
              .limit(1);
              
            let last_login = null;
            let last_logout = null;
            
            if (!loginError && loginEvents && loginEvents.length > 0) {
              last_login = loginEvents[0].created_at;
            }
            
            if (!logoutError && logoutEvents && logoutEvents.length > 0) {
              last_logout = logoutEvents[0].created_at;
            }
            
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
