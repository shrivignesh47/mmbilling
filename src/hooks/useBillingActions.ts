import { useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, BillItem, Transaction, TransactionResponse } from "@/components/billing/types";
import {
  addToBill,
  updateItemQuantity,
  removeItem,
  clearBill,
  getTotalAmount,
  downloadReceipt,
  billItemsToJson,
  parseTransactionItems
} from "@/components/utils/BillingUtils";
import { exportToExcel, formatProductsForExport } from "@/components/utils/ExportUtils";

interface UseBillingActionsProps {
  products: Product[];
  billItems: BillItem[];
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>;
  setIsCheckoutDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsReceiptDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setReceiptData: React.Dispatch<React.SetStateAction<Transaction | null>>;
  setIsPaymentProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  receiptRef: React.RefObject<HTMLDivElement>;
  profile: any;
}

export const useBillingActions = ({
  products,
  billItems,
  setBillItems,
  setIsCheckoutDialogOpen,
  setIsReceiptDialogOpen,
  setReceiptData,
  setIsPaymentProcessing,
  receiptRef,
  profile
}: UseBillingActionsProps) => {
  const handleAddToBill = (product: Product) => {
    addToBill(product, billItems, setBillItems, toast);
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    updateItemQuantity(index, quantity, billItems, setBillItems, products, toast, handleRemoveItem);
  };

  const handleRemoveItem = (index: number) => {
    removeItem(index, billItems, setBillItems);
  };

  const handleClearBill = () => {
    clearBill(billItems, setBillItems, toast);
  };

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
        payment_details: paymentDetails
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
        const transaction: Transaction = {
          id: transactionResult.id,
          transaction_id: transactionResult.transaction_id,
          created_at: transactionResult.created_at,
          amount: transactionResult.amount,
          items: parseTransactionItems(transactionResult.items),
          payment_method: transactionResult.payment_method,
          payment_details: transactionResult.payment_details
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

  const handleDownloadReceipt = () => {
    if (receiptRef.current) {
      downloadReceipt(receiptRef, null); // The receipt component will handle the data
    }
  };

  const viewTransaction = async (transaction: Transaction) => {
    setReceiptData(transaction);
    setIsReceiptDialogOpen(true);
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    
    const formattedData = formatProductsForExport(products);
    exportToExcel(formattedData, 'products-inventory');
    toast.success('Products exported to Excel');
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Search for product by barcode
    const product = products.find(p => 
      p.barcode === barcode || p.sku === barcode || `PROD-${p.id.slice(-8).toUpperCase()}` === barcode
    );
    
    if (product) {
      handleAddToBill(product);
      toast.success(`Added ${product.name} to bill`);
    } else {
      toast.error('Product not found');
    }
  };

  return {
    handleAddToBill,
    handleUpdateItemQuantity,
    handleRemoveItem,
    handleClearBill,
    handleCheckout,
    handleBarcodeScanned,
    viewTransaction,
    handleDownloadReceipt,
    handleExportProducts
  };
};
