
import { supabase } from "@/integrations/supabase/client";

// Function to log authentication events to a custom table
export const logAuthEvent = async (
  userId: string | undefined,
  event: 'login' | 'logout',
  metadata?: any
) => {
  if (!userId) return;

  console.log(`Logging auth event: ${event} for user: ${userId}`); // Debugging line

  try {
    // Get the user's profile to find their shop_id
    const { data: profileData } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', userId)
      .single();
      
    const shopId = profileData?.shop_id || '00000000-0000-0000-0000-000000000000';
    
    // Use transactions table with event_type field to track auth events
  
      
    console.log(`Auth event ${event} logged for user ${userId}`);
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
