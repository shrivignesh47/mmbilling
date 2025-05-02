
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { BillItem, PaymentDetails, Transaction } from "@/components/billing/types";
import { toast } from "sonner";
import { updateProductStock, logInventoryChange } from './usePaymentProcessor';

// Renaming the existing functions to avoid name clashes
export const updateProductStockAfterSale = updateProductStock;
export const logInventoryChangeAfterSale = logInventoryChange;

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
  const handleCheckout = async (method: 'cash' | 'card' | 'upi', paymentDetails: PaymentDetails) => {
    if (billItems.length === 0) {
      toast.error("No items in bill");
      return;
    }
    
    setIsPaymentProcessing(true);
    
    try {
      const totalAmount = billItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Generate a transaction ID
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      
      // Insert transaction record
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          transaction_id: transactionId,
          amount: totalAmount,
          items: billItems,
          payment_method: method,
          payment_details: paymentDetails,
          cashier_id: profile?.id,
          shop_id: profile?.shop_id
        })
        .select()
        .single();
      
      if (transactionError) {
        throw transactionError;
      }
      
      // Update product stock levels
      await updateProductStockAfterSale(billItems);
      
      // Log inventory changes
      if (profile?.shop_id) {
        await logInventoryChangeAfterSale(billItems, profile.shop_id, transactionId);
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
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast.error(`Payment failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsPaymentProcessing(false);
    }
  };
  
  return {
    handleCheckout
  };
};
