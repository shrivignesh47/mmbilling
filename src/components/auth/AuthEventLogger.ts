
import { supabase } from "@/integrations/supabase/client";

// Function to log authentication events to a custom table
export const logAuthEvent = async (
  userId: string | undefined,
  event: 'login' | 'logout',
  metadata?: any
) => {
  if (!userId) return;
  
  try {
    // Use transactions table instead of auth_events since it exists in the schema
    await supabase
      .from('transactions')
      .insert({
        transaction_id: `auth-${Date.now()}`,
        user_id: userId,
        event_type: event,
        items: metadata || {},
        shop_id: '00000000-0000-0000-0000-000000000000', // Default shop ID
        amount: 0, // Not applicable for auth events
        payment_method: 'system' // Not applicable for auth events
      });
  } catch (error) {
    console.error('Failed to log auth event:', error);
  }
};

// Hook into Supabase auth state changes to log events
export const setupAuthEventLogging = () => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      logAuthEvent(session?.user?.id, 'login');
    } else if (event === 'SIGNED_OUT') {
      logAuthEvent(session?.user?.id, 'logout');
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};
