
export interface UserProfile {
  id: string;
  name: string | null;
  role: string;
  custom_permissions?: string[];
}

export interface Permission {
  code: string;
  name: string;
}
