
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
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profile);
        } else {
          setProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            setProfile(profile);
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

      if (error) throw error;

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

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
          }
        }
      }
      
      toast.success("Login successful");
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    navigate("/login");
    toast.success("Logged out successfully");
  };

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
