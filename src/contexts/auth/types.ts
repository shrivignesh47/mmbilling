
import { User, Session } from "@supabase/supabase-js";

export type UserRole = "owner" | "manager" | "cashier" | "staff" | string;

export interface Permission {
  id: string;
  name: string;
  description: string;
  code: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // Permission codes
}

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  shop_id?: string;
  shop_name?: string;  // Added to store shop name for easier access
  custom_permissions?: string[]; // Individual permissions assigned directly to user
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{
    user?: User | null;
    profile?: Profile | null;
    error?: Error | null;
    data?: Session | null;
  }>;
  logout: () => Promise<void>;
}
