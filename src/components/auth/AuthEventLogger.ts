
import { supabase } from "@/integrations/supabase/client";

// Function to log authentication events to a custom table
export const logAuthEvent = async (
  userId: string | undefined,
  event: 'login' | 'logout',
  metadata?: any
) => {
  if (!userId) return;
  
  try {
    await supabase
      .from('auth_events')
      .insert({
        user_id: userId,
        event: event,
        metadata: metadata || {}
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
