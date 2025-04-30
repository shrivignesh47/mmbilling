
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

export async function fetchUserProfile(userId: string): Promise<Profile | null> {
  try {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    // If profile has shop_id, fetch the shop name
    if (profileData && profileData.shop_id) {
      try {
        const { data: shopData, error: shopError } = await supabase
          .from('shops')
          .select('name')
          .eq('id', profileData.shop_id)
          .single();
        
        if (!shopError && shopData) {
          return {
            ...profileData,
            shop_name: shopData.name
          };
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      }
    }
    
    return profileData;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}
