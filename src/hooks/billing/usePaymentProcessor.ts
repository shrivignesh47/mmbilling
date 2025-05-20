
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { BillItem, PaymentDetails, Transaction } from "@/components/billing/types";
import { toast } from "sonner";
import { billItemsToJson } from "@/components/utils/BillingUtils";
import { Json } from "@/integrations/supabase/types";

// Implementation of inventory functions
export const updateProductStockInternal = async (billItems: BillItem[]) => {
  for (const item of billItems) {
    try {
      // Find the product
      const { data: product } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single();
      
      if (!product) continue;
      
      // Calculate new stock level
      const newStock = Math.max(0, product.stock - item.quantity);
      
      // Update the product stock
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.productId);
    } catch (error: any) {
      console.error(`Error updating stock for product ${item.productId}:`, error);
    }
  }
};

export const logInventoryChangeInternal = async (billItems: BillItem[], shopId: string, transactionId: string) => {
  try {
    const inventoryLogs = billItems.map(item => ({
      product_id: item.productId,
      product_name: item.name,
      quantity: item.quantity,
      shop_id: shopId,
      action: 'sale',
      transaction_id: transactionId
    }));
    
    await supabase
      .from('inventory_logs')
      .insert(inventoryLogs);
  } catch (error: any) {
    console.error('Error logging inventory changes:', error);
  }
};

type UsePaymentProcessorProps = {
  billItems: BillItem[];
  profile: any;
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>;
  setIsCheckoutDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReceiptData: React.Dispatch<React.SetStateAction<Transaction | null>>;
  setIsReceiptDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaymentProcessing: React.Dispatch<React.SetStateAction<boolean>>;
};

export const usePaymentProcessor = ({
  billItems,
  profile,
  setBillItems,
  setIsCheckoutDialogOpen,
  setReceiptData,
  setIsReceiptDialogOpen,
  setIsPaymentProcessing
}: UsePaymentProcessorProps) => {
  const handleCheckout = async (method: 'cash' | 'card' | 'upi', paymentDetails: PaymentDetails): Promise<string> => {
    if (billItems.length === 0) {
      toast.error("No items in bill");
      return Promise.reject("No items in bill");
    }
    
    setIsPaymentProcessing(true);
    
    try {
      const totalAmount = billItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Generate a transaction ID
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Convert billItems to Json compatible format
      const jsonItems = billItemsToJson(billItems);
      
      // Convert paymentDetails to Json compatible format
      const jsonPaymentDetails = JSON.parse(JSON.stringify(paymentDetails)) as unknown as Json;
      
      // Insert transaction record
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_id: transactionId,
          amount: totalAmount,
          items: jsonItems,
          payment_method: method,
          payment_details: jsonPaymentDetails,
          cashier_id: profile?.id,
          shop_id: profile?.shop_id
        })
        .select()
        .single();
      
      if (transactionError) {
        throw transactionError;
      }
      
      // Update product stock levels
      await updateProductStockInternal(billItems);
      
      // Log inventory changes
      if (profile?.shop_id) {
        await logInventoryChangeInternal(billItems, profile.shop_id, transactionId);
      }
      
      // Close checkout dialog
      setIsCheckoutDialogOpen(false);
      
      // Set receipt data for displaying receipt
      setReceiptData(transactionData as unknown as Transaction);
      
      // Clear bill
      setBillItems([]);
      
      // Show success message
      toast.success("Payment successful!");
      
      // Open receipt dialog
      setIsReceiptDialogOpen(true);

      // Return the transaction ID
      return transactionId;
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(`Payment failed: ${error.message || "Unknown error"}`);
      return Promise.reject(error);
    } finally {
      setIsPaymentProcessing(false);
    }
  };
  
  return {
    handleCheckout
  };
};
