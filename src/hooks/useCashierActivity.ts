
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
        const cashierResponse = await supabase
          .from('profiles')
          .select('id, name, email, shop_id')
          .eq('shop_id', shopId)
          .eq('role', 'cashier');
          
        if (cashierResponse.error) throw cashierResponse.error;
        
        const cashierData = cashierResponse.data || [];
        
        if (cashierData.length === 0) {
          setCashiers([]);
          setIsLoading(false);
          return;
        }
        
        // Prepare for fetching additional data
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Process each cashier individually to avoid deep type inference
        const cashierActivityData: CashierActivity[] = [];
        
        for (const cashier of cashierData) {
          // Initialize cashier activity object
          const cashierActivity: CashierActivity = {
            id: cashier.id,
            name: cashier.name,
            email: cashier.email,
            last_login: null,
            last_logout: null,
            daily_sales: 0,
            daily_transactions: 0
          };
          
          // Handle login events in a separate try-catch block
          try {
            const loginResult = await supabase
              .from('transactions')
              .select('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'login')
              .order('created_at', { ascending: false })
              .limit(1);
              
            // Extract data safely after the query is complete
            if (loginResult.data && loginResult.data.length > 0) {
              cashierActivity.last_login = loginResult.data[0].created_at;
            }
          } catch (err) {
            console.error('Error fetching login data:', err);
          }
          
          // Handle logout events in a separate try-catch block
          try {
            const logoutResult = await supabase
              .from('transactions')
              .select('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'logout')
              .order('created_at', { ascending: false })
              .limit(1);
              
            // Extract data safely after the query is complete
            if (logoutResult.data && logoutResult.data.length > 0) {
              cashierActivity.last_logout = logoutResult.data[0].created_at;
            }
          } catch (err) {
            console.error('Error fetching logout data:', err);
          }
          
          // Handle transactions in a separate try-catch block
          try {
            const txResult = await supabase
              .from('transactions')
              .select('amount')
              .eq('cashier_id', cashier.id)
              .eq('shop_id', shopId)
              .gte('created_at', today.toISOString());
              
            // Process transaction data
            if (txResult.data) {
              cashierActivity.daily_sales = txResult.data.reduce((sum, tx) => sum + Number(tx.amount), 0);
              cashierActivity.daily_transactions = txResult.data.length;
            }
          } catch (err) {
            console.error('Error fetching transaction data:', err);
          }
          
          // Add cashier activity to the array
          cashierActivityData.push(cashierActivity);
        }
        
        // Update state with all cashier activity data
        setCashiers(cashierActivityData);
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
