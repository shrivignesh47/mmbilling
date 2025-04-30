
import { User, Session } from "@supabase/supabase-js";

export type UserRole = "owner" | "manager" | "cashier";

export interface Profile {
  id: string;
  name: string;
  role: UserRole;
  shop_id?: string;
  shop_name?: string;  // Added to store shop name for easier access
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{user: User | null, profile: Profile | null}>;
  logout: () => Promise<void>;
}
