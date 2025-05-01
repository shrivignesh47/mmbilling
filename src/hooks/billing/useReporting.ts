
import { toast } from "sonner";
import { Product } from "@/components/billing/types";
import { exportToExcel, formatProductsForExport } from "@/components/utils/ExportUtils";

export const useReporting = (products: Product[]) => {
  const handleExportProducts = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    
    const formattedData = formatProductsForExport(products);
    exportToExcel(formattedData, 'products-inventory');
    toast.success('Products exported to Excel');
  };

  return { handleExportProducts };
};
