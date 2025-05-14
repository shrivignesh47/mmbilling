
export type UserRole = "owner" | "manager" | "cashier" | "staff" | string;

export interface UserProfile {
  id: string;
  name: string | null;
  role: UserRole;
  custom_permissions?: string[];
}

export interface Permission {
  code: string;
  name: string;
  description?: string;
}

// Add the new permission to your list of permissions
export const STANDARD_PERMISSIONS: Permission[] = [
  {
    code: "transactions.view",
    name: "View Transactions",
    description: "Allows viewing transaction history and details"
  }
];
