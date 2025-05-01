
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BillItem, Transaction } from "@/components/billing/types";
import {
  getTotalAmount,
  billItemsToJson,
  parseTransactionItems
} from "@/components/utils/BillingUtils";

interface PaymentProcessorProps {
  billItems: BillItem[];
  profile: any;
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>;
  setIsCheckoutDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReceiptData: React.Dispatch<React.SetStateAction<Transaction | null>>;
  setIsReceiptDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPaymentProcessing: React.Dispatch<React.SetStateAction<boolean>>;
}

export const usePaymentProcessor = ({
  billItems,
  profile,
  setBillItems,
  setIsCheckoutDialogOpen,
  setReceiptData,
  setIsReceiptDialogOpen,
  setIsPaymentProcessing
}: PaymentProcessorProps) => {
  
  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'upi', paymentDetails: any) => {
    if (billItems.length === 0) {
      toast.error('Cannot checkout an empty bill');
      return;
    }

    if (!profile?.shop_id) {
      toast.error('Shop ID is required');
      return;
    }

    setIsPaymentProcessing(true);

    try {
      // Generate a transaction ID
      const transactionId = `INV-${Date.now().toString().slice(-8)}`;

      // Create the transaction record
      const transactionData = {
        shop_id: profile.shop_id,
        cashier_id: profile.id,
        transaction_id: transactionId,
        amount: getTotalAmount(billItems),
        items: billItemsToJson(billItems),
        payment_method: paymentMethod,
        payment_details: paymentDetails || {}
      };

      const { data: transactionResult, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update product stock and sales count
      for (const item of billItems) {
        await supabase.rpc('decrement_stock', { 
          p_id: item.productId, 
          amount: item.quantity 
        });
        
        await supabase.rpc('increment_sales', {
          p_id: item.productId,
          amount: item.quantity
        });
      }

      // Show success message
      toast.success('Payment processed successfully');
      
      if (transactionResult) {
        // Process transaction result
        const transaction: Transaction = {
          id: transactionResult.id,
          transaction_id: transactionResult.transaction_id,
          created_at: transactionResult.created_at,
          amount: transactionResult.amount,
          items: parseTransactionItems(transactionResult.items),
          payment_method: transactionResult.payment_method,
          payment_details: paymentDetails || {}
        };
        
        setReceiptData(transaction);
        setIsReceiptDialogOpen(true);
      }
      
      // Reset the bill
      setBillItems([]);
      setIsCheckoutDialogOpen(false);
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  return { handleCheckout };
};
