
export type UserRole = "owner" | "manager" | "cashier" | string;

export interface UserProfile {
  id: string;
  name: string | null;
  role: UserRole;
  custom_permissions?: string[];
}

export interface Permission {
  code: string;
  name: string;
}
