
import { UnitType } from "@/components/utils/UnitUtils";

export interface BillItem {
  productId: string | number;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
  unitType?: string; // Add this optional property
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
  shop_id?: string;
  created_at?: string;
  updated_at?: string;
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
