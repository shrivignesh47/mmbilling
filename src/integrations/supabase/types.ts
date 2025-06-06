export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      custom_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          permissions: string[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          permissions?: string[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          permissions?: string[] | null
        }
        Relationships: []
      }
      inventory_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          product_id: string
          product_name: string
          quantity: number
          shop_id: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          product_id: string
          product_name: string
          quantity: number
          shop_id: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          shop_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_logs_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          created_at: string | null
          id: string
          notification_id: string | null
          read: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_id?: string | null
          read?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_id?: string | null
          read?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          priority: string
          recipient_type: string
          role: string | null
          sender_id: string
          sender_name: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          priority: string
          recipient_type: string
          role?: string | null
          sender_id: string
          sender_name?: string | null
          status: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          priority?: string
          recipient_type?: string
          role?: string | null
          sender_id?: string
          sender_name?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string | null
          id: string
          name: string
          price: number
          sales_count: number | null
          shop_id: string
          sku: string | null
          stock: number
          unitType: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          price?: number
          sales_count?: number | null
          shop_id: string
          sku?: string | null
          stock?: number
          unitType?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          sales_count?: number | null
          shop_id?: string
          sku?: string | null
          stock?: number
          unitType?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          custom_permissions: string[] | null
          email: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          shop_id: string | null
          updated_at: string | null
          custom_role_id: string | null // Added custom_role_id column
        }
        Insert: {
          created_at?: string | null
          custom_permissions?: string[] | null
          email?: string | null
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          shop_id?: string | null
          updated_at?: string | null
          custom_role_id?: string | null // Added custom_role_id column
        }
        Update: {
          created_at?: string | null
          custom_permissions?: string[] | null
          email?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          shop_id?: string | null
          updated_at?: string | null
          custom_role_id?: string | null // Added custom_role_id column
        }
        Relationships: [
          {
            foreignKeyName: "fk_shop"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          cashier_id: string | null
          created_at: string | null
          id: string
          items: Json
          payment_details: Json | null
          payment_method: string
          shop_id: string
          transaction_id: string
        }
        Insert: {
          amount: number
          cashier_id?: string | null
          created_at?: string | null
          id?: string
          items: Json
          payment_details?: Json | null
          payment_method: string
          shop_id: string
          transaction_id: string
        }
        Update: {
          amount?: number
          cashier_id?: string | null
          created_at?: string | null
          id?: string
          items?: Json
          payment_details?: Json | null
          payment_method?: string
          shop_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        customers: {
          Row: {
            id: string;
            name: string | null;
            phone: string;
            email: string | null;
            address: string | null;
            transaction_id: string;
          };
          Insert: {
            id?: string;
            name?: string | null;
            phone: string;
            email?: string | null;
            address?: string | null;
            transaction_id: string;
          };
          Update: {
            id?: string;
            name?: string | null;
            phone?: string;
            email?: string | null;
            address?: string | null;
            transaction_id?: string;
          };
          Relationships: [
            {
              foreignKeyName: "customers_transaction_id_fkey";
              columns: ["transaction_id"];
              isOneToOne: false;
              referencedRelation: "transactions";
              referencedColumns: ["transaction_id"];
            }
          ];
        };
        Row: {
          id: string;
          transaction_id: string;
          product_id: string;
          returned_quantity: number;
          return_reason: string;
          return_date: string;
          status: string;
        };
        Insert: {
          transaction_id: string;
          product_id: string;
          returned_quantity: number;
          return_reason: string;
          return_date: string;
          status: string;
        };
        Update: {
          transaction_id?: string;
          product_id?: string;
          returned_quantity?: number;
          return_reason?: string;
          return_date?: string;
          status?: string;
        };
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: { requested_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      decrement_stock: {
        Args: { p_id: string; amount: number }
        Returns: number
      }
      increment_sales: {
        Args: { p_id: string; amount: number }
        Returns: number
      }
    }
    Enums: {
      user_role: "owner" | "manager" | "cashier"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["owner", "manager", "cashier"],
    },
  },
} as const

export type Customer = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  transaction_id: string;
};
