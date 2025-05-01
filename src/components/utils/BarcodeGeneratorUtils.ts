
import JsBarcode from 'jsbarcode';
import { exportToExcel } from './ExportUtils';

export const generateBarcode = (product: { id: string; sku?: string | null }): string => {
  // Generate a standard barcode format using product id or sku
  if (product.sku) {
    return product.sku;
  }
  
  // Use last 8 digits of UUID as code if no SKU
  return `PROD-${product.id.slice(-8).toUpperCase()}`;
};

export const renderBarcodeToCanvas = (
  canvas: HTMLCanvasElement | null, 
  barcodeValue: string,
  options = {}
): void => {
  if (!canvas) return;
  
  try {
    JsBarcode(canvas, barcodeValue, {
      format: "CODE128",
      lineColor: "#000",
      width: 2,
      height: 40,
      displayValue: true,
      fontSize: 12,
      ...options
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
  }
};

export const downloadBarcode = (canvas: HTMLCanvasElement | null, productName: string): void => {
  if (!canvas) return;
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.download = `barcode-${productName.replace(/\s+/g, '-').toLowerCase()}.png`;
  
  // Convert canvas to blob and create URL
  canvas.toBlob((blob) => {
    if (blob) {
      link.href = URL.createObjectURL(blob);
      link.click();
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
    }
  });
};

export const exportBarcodesToExcel = (products: any[]): void => {
  const barcodeData = products.map(product => ({
    'Product Name': product.name,
    'SKU': product.sku || '',
    'Barcode': product.barcode || generateBarcode(product),
    'Category': product.category || '',
    'Price': product.price
  }));
  
  exportToExcel(barcodeData, 'product-barcodes');
};
