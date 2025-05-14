
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { setupAuthEventLogging, logAuthEvent } from '@/components/auth/AuthEventLogger';

// Import your types but don't modify them
import { Profile } from './types';

// Create the context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean; // Add missing property
  login: (email: string, password: string) => Promise<{ 
    user?: User | null;
    profile?: Profile | null;
    error?: Error | null; 
    data?: Session | null 
  }>;
  logout: () => Promise<void>;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
}

// Default values for the context
const defaultValues: AuthContextType = {
  session: null,
  user: null,
  profile: null,
  loading: true,
  profileLoading: true,
  isAuthenticated: false, // Add missing property
  login: async () => ({ error: null, data: null }),
  logout: async () => {},
  setProfile: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultValues);

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*, shops(*), custom_permissions') // Ensure custom_permissions are included
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Handle the response from Supabase correctly
        const profileData: Profile = {
          id: data.id,
          name: data.name || '',
          role: data.role,
          shop_id: data.shop_id,
          shop_name: data.shops?.name || null,
          custom_permissions: data.custom_permissions || [] // Set custom_permissions
        };
        
        setProfile(profileData);
        return profileData;
      }
      return null;
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  // Auth state change listener
  useEffect(() => {
    // Set up auth logging
    const unsubscribeAuthLogging = setupAuthEventLogging();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Sync auth state with our context
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAuthenticated(!!currentSession);

        if (event === 'SIGNED_IN' && currentSession?.user) {
          // Fetch profile when user signs in
          fetchProfile(currentSession.user.id);
          // Log auth event
          logAuthEvent(currentSession.user.id, 'login');
        } else if (event === 'SIGNED_OUT') {
          // Clear profile when user signs out
          setProfile(null);
        }
      }
    );

    // Initial session check
    const initializeAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsAuthenticated(!!initialSession);

      if (initialSession?.user) {
        await fetchProfile(initialSession.user.id);
      }

      setLoading(false);
    };

    initializeAuth();

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe();
      unsubscribeAuthLogging();
    };
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, data: null };
      }

      let userProfile = null;
      if (data.user) {
        // Fetch profile after successful login
        userProfile = await fetchProfile(data.user.id);
      }

      setIsAuthenticated(!!data.session);
      return { user: data.user, profile: userProfile, data: data.session };
    } catch (error) {
      return { error: error as Error, data: null };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Log the logout event before actually logging out
      if (user) {
        await logAuthEvent(user.id, 'logout');
      }
      
      await supabase.auth.signOut();
      setProfile(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    profileLoading,
    isAuthenticated,
    login,
    logout,
    setProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
