
// Define role type for profiles
export type UserRole = "owner" | "manager" | "cashier" | string;

// Custom role definitions
export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at?: string;
}

// Notification types
export type NotificationRecipientType = "role" | "all" | "specific";

export interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string;
  sender_name: string | null;
  created_at: string;
  status: string;
  priority: string;
  recipient_type: NotificationRecipientType;
  role?: string | null;
  read?: boolean;
}

export interface NotificationRecipient {
  id: string;
  notification_id: string;
  user_id: string;
  read: boolean;
  created_at: string;
  notification?: Notification;
}
