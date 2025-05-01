
import { toast } from "sonner";
import { Product } from "@/components/billing/types";

export const useBarcodeScanner = (
  products: Product[],
  handleAddToBill: (product: Product) => void
) => {
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

  return { handleBarcodeScanned };
};
