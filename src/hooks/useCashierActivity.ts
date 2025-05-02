
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

// Define explicit types for our transaction data
interface TransactionAuthEvent {
  created_at: string;
}

interface TransactionAmount {
  amount: number;
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
        
        // Fetch activity data for all cashiers - avoiding deep type inference issues
        const cashierPromises = cashierData.map(async (cashier) => {
          let last_login: string | null = null;
          let last_logout: string | null = null;
          let daily_sales = 0;
          let daily_transactions = 0;
          
          // Handle login events
          try {
            const { data: loginData, error: loginError } = await supabase
              .from('transactions')
              .select('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'login')
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (!loginError && loginData && loginData.length > 0) {
              last_login = loginData[0].created_at;
            }
          } catch (err) {
            console.error('Error fetching login data:', err);
          }
          
          // Handle logout events
          try {
            const { data: logoutData, error: logoutError } = await supabase
              .from('transactions')
              .select('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'logout')
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (!logoutError && logoutData && logoutData.length > 0) {
              last_logout = logoutData[0].created_at;
            }
          } catch (err) {
            console.error('Error fetching logout data:', err);
          }
          
          // Handle transactions data
          try {
            const { data: txData, error: txError } = await supabase
              .from('transactions')
              .select('amount')
              .eq('cashier_id', cashier.id)
              .eq('shop_id', shopId)
              .gte('created_at', today.toISOString());
              
            if (!txError && txData && txData.length > 0) {
              daily_sales = txData.reduce((sum, tx) => sum + Number(tx.amount), 0);
              daily_transactions = txData.length;
            }
          } catch (err) {
            console.error('Error fetching transaction data:', err);
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
        });
        
        const cashiersWithActivity = await Promise.all(cashierPromises);
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
