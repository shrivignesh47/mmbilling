
import { UnitType } from "@/components/utils/UnitUtils";
import { Json } from "@/integrations/supabase/types";

export interface BillItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unitType?: UnitType;
  barcode?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sku: string | null;
  barcode?: string;
  unitType?: UnitType;
  sales_count?: number;
}

export interface PaymentDetails {
  method: 'cash' | 'card' | 'upi';
  amountPaid?: number;
  changeAmount?: number;
  reference?: string;
}

export interface Transaction {
  id: string;
  transaction_id: string;
  created_at: string;
  amount: number;
  items: BillItem[];
  payment_method: string;
  payment_details: PaymentDetails;
}

export interface TransactionResponse {
  id: string;
  transaction_id: string;
  created_at: string;
  amount: number;
  items: any;
  payment_method: string;
  payment_details?: any;
  cashier_id: string;
  shop_id: string;
}

export interface ShopDetails {
  name: string;
  address: string;
}
