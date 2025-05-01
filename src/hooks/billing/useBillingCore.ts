
import { toast } from "sonner";
import { Product, BillItem } from "@/components/billing/types";
import {
  addToBill as addItemToBill,
  updateItemQuantity as updateQuantity,
  removeItem as removeItemFromBill,
  clearBill as clearAllItems
} from "@/components/utils/BillingUtils";

export const useBillingCore = (
  products: Product[],
  billItems: BillItem[],
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>
) => {
  // Add product to bill
  const handleAddToBill = (product: Product) => {
    addItemToBill(product, billItems, setBillItems, toast);
  };

  // Update quantity of item in bill
  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    updateQuantity(index, quantity, billItems, setBillItems, products, toast, handleRemoveItem);
  };

  // Remove item from bill
  const handleRemoveItem = (index: number) => {
    removeItemFromBill(index, billItems, setBillItems);
  };

  // Clear entire bill
  const handleClearBill = () => {
    clearAllItems(billItems, setBillItems, toast);
  };

  return {
    handleAddToBill,
    handleUpdateItemQuantity,
    handleRemoveItem,
    handleClearBill
  };
};
