
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, BillItem, Transaction } from "@/components/billing/types";
import { useBillingCore } from "@/hooks/billing/useBillingCore";
import { usePaymentProcessor } from "@/hooks/billing/usePaymentProcessor";
import { useReceiptHandler } from "@/hooks/billing/useReceiptHandler";
import { useBarcodeScanner } from "@/hooks/billing/useBarcodeScanner";
import { useReporting } from "@/hooks/billing/useReporting";

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
  // Core billing operations
  const { 
    handleAddToBill,
    handleUpdateItemQuantity, 
    handleRemoveItem,
    handleClearBill
  } = useBillingCore(products, billItems, setBillItems);

  // Payment processing
  const { handleCheckout } = usePaymentProcessor({
    billItems,
    profile,
    setBillItems,
    setIsCheckoutDialogOpen,
    setReceiptData,
    setIsReceiptDialogOpen,
    setIsPaymentProcessing
  });

  // Receipt handling
  const { 
    handleDownloadReceipt, 
    viewTransaction 
  } = useReceiptHandler(receiptRef, setReceiptData, setIsReceiptDialogOpen);

  // Barcode scanning
  const { handleBarcodeScanned } = useBarcodeScanner(products, handleAddToBill);

  // Reporting
  const { handleExportProducts } = useReporting(products);

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
