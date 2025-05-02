
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define interfaces for easier type handling
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
        
        // Create an array to store all cashier activity
        const cashiersActivityData: CashierActivity[] = [];
        
        // Process each cashier individually to avoid deep type inference issues
        for (const cashier of cashierData) {
          // Initialize cashier activity object with default values
          const cashierActivity: CashierActivity = {
            id: cashier.id,
            name: cashier.name,
            email: cashier.email,
            last_login: null,
            last_logout: null,
            daily_sales: 0,
            daily_transactions: 0
          };
          
          try {
            // Get login events - simplified query
            const { data: loginData } = await supabase
              .from('transactions')
              .select('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'login')
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (loginData && loginData.length > 0) {
              cashierActivity.last_login = loginData[0].created_at;
            }
          } catch (err) {
            console.error('Error fetching login data:', err);
          }
          
          try {
            // Get logout events - simplified query
            const { data: logoutData } = await supabase
              .from('transactions')
              .select('created_at')
              .eq('user_id', cashier.id)
              .eq('event_type', 'logout')
              .order('created_at', { ascending: false })
              .limit(1);
              
            if (logoutData && logoutData.length > 0) {
              cashierActivity.last_logout = logoutData[0].created_at;
            }
          } catch (err) {
            console.error('Error fetching logout data:', err);
          }
          
          try {
            // Get daily sales transactions - simplified query
            const { data: txData } = await supabase
              .from('transactions')
              .select('amount')
              .eq('cashier_id', cashier.id)
              .eq('shop_id', shopId)
              .gte('created_at', today.toISOString());
              
            if (txData) {
              cashierActivity.daily_sales = txData.reduce((sum, tx) => sum + Number(tx.amount), 0);
              cashierActivity.daily_transactions = txData.length;
            }
          } catch (err) {
            console.error('Error fetching transaction data:', err);
          }
          
          // Add cashier activity to the results array
          cashiersActivityData.push(cashierActivity);
        }
        
        // Update state with all cashier activity data
        setCashiers(cashiersActivityData);
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
