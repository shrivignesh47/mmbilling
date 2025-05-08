
import { Database } from "@/integrations/supabase/types";

// Extend Supabase types to include our new tables
export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string;
  sender_name?: string;
  recipient_type: "all" | "role" | "specific";
  role?: string;
  priority: "low" | "medium" | "high";
  created_at: string;
  status: "sent" | "delivered" | "failed";
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  user_id: string;
  read: boolean;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
}

export interface Role {
  id: string;
  name: string;
}

// Add these tables to the extended Database interface as needed
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Insert"];

export type TablesRow<T extends keyof Database["public"]["Tables"]> = 
  Database["public"]["Tables"][T]["Row"];
