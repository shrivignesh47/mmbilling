
import { Transaction } from "@/components/billing/types";
import { downloadReceipt as downloadReceiptUtil } from "@/components/utils/BillingUtils";

export const useReceiptHandler = (
  receiptRef: React.RefObject<HTMLDivElement>,
  setReceiptData: React.Dispatch<React.SetStateAction<Transaction | null>>,
  setIsReceiptDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const handleDownloadReceipt = () => {
    if (receiptRef.current) {
      downloadReceiptUtil(receiptRef, null); // The receipt component will handle the data
    }
  };

  const viewTransaction = async (transaction: Transaction) => {
    setReceiptData(transaction);
    setIsReceiptDialogOpen(true);
  };

  return {
    handleDownloadReceipt,
    viewTransaction
  };
};
