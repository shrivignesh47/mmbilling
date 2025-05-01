
import JsBarcode from "jsbarcode";

// Generates a unique barcode based on product details
export const generateProductBarcode = (product: { id: string; name: string; sku?: string | null }): string => {
  // Use SKU if available, otherwise generate from product ID
  const barcodeValue = product.sku || `PROD-${product.id.slice(-8).toUpperCase()}`;
  return barcodeValue;
};

// Generate a barcode as SVG
export const generateBarcodeSVG = (value: string): string => {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, {
    format: "CODE128",
    lineColor: "#000",
    width: 2,
    height: 50,
    displayValue: true
  });
  return canvas.toDataURL('image/png');
};

// Generate QR code for scanning at checkout
export const generateQRCode = async (value: string): Promise<string> => {
  try {
    // Dynamically import qrcode
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(value, {
      width: 200,
      margin: 1
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    // Return a placeholder or empty string if QR code generation fails
    return '';
  }
};
