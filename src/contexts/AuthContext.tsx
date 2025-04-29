
import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UserRole = "owner" | "manager" | "cashier";

interface Profile {
  id: string;
  name: string;
  role: UserRole;
  shop_id?: string;
  shop_name?: string;  // Added to store shop name for easier access
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (error) throw error;
              
              // If profile has shop_id, fetch the shop name
              if (profileData && profileData.shop_id) {
                const { data: shopData, error: shopError } = await supabase
                  .from('shops')
                  .select('name')
                  .eq('id', profileData.shop_id)
                  .single();
                
                if (!shopError && shopData) {
                  setProfile({
                    ...profileData,
                    shop_name: shopData.name
                  });
                  return;
                }
              }
              
              setProfile(profileData);
            } catch (error) {
              console.error("Error fetching profile:", error);
              setProfile(null);
            }
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session without automatic redirection
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(async ({ data: profileData, error }) => {
            if (error) {
              console.error("Error fetching profile:", error);
              setProfile(null);
              setLoading(false);
              return;
            }
            
            // If profile has shop_id, fetch the shop name
            if (profileData && profileData.shop_id) {
              try {
                const { data: shopData, error: shopError } = await supabase
                  .from('shops')
                  .select('name')
                  .eq('id', profileData.shop_id)
                  .single();
                
                if (!shopError && shopData) {
                  setProfile({
                    ...profileData,
                    shop_name: shopData.name
                  });
                  setLoading(false);
                  return;
                }
              } catch (shopError) {
                console.error("Error fetching shop:", shopError);
              }
            }
            
            setProfile(profileData);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message || "Login failed");
        throw error;
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw new Error("Failed to fetch user profile");
        }

        // Redirect based on role
        if (profile) {
          switch (profile.role) {
            case "owner":
              navigate("/owner/dashboard");
              break;
            case "manager":
              navigate("/manager/dashboard");
              break;
            case "cashier":
              navigate("/cashier/dashboard");
              break;
            default:
              console.error("Unknown role:", profile.role);
              toast.error("Unknown role. Please contact support.");
          }
        }
      }
      
      toast.success("Login successful");
    } catch (error: any) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  async function logout() {
      try {
          setLoading(true);
          
          // Sign out from Supabase
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          // Clear all auth states
          setUser(null);
          setProfile(null);
          setSession(null);
          
          // Force clear all relevant storage
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.removeItem('supabase.auth.token');
          
          // Additional cleanup for any other storage items
          Object.keys(localStorage)
            .filter(key => key.startsWith('supabase.'))
            .forEach(key => localStorage.removeItem(key));
            
          Object.keys(sessionStorage)
            .filter(key => key.startsWith('supabase.'))
            .forEach(key => sessionStorage.removeItem(key));
            
          // Ensure navigation to login page after successful logout
          console.log("Navigating to login page");
          navigate("/login", { replace: true });
          toast.success("Logged out successfully");
      } catch (error) {
          console.error("Logout error:", error);
          toast.error("Failed to logout. Please try again.");
      } finally {
          setLoading(false);
      }
  }

  const value = {
    user,
    profile,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Higher-order component to protect routes
export const withAuth = (Component: React.ComponentType, requiredRole?: UserRole | UserRole[]) => {
  return (props: any) => {
    const { user, profile, loading, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          navigate("/login");
          return;
        }

        if (requiredRole && profile) {
          const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
          
          if (!roles.includes(profile.role)) {
            switch (profile.role) {
              case "owner":
                navigate("/owner/dashboard");
                break;
              case "manager":
                navigate("/manager/dashboard");
                break;
              case "cashier":
                navigate("/cashier/dashboard");
                break;
              default:
                navigate("/login");
            }
          }
        }
      }
    }, [loading, isAuthenticated, profile, navigate]);

    if (loading) {
      return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && profile) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(profile.role)) {
        return null;
      }
    }

    return <Component {...props} />;
  };
};
