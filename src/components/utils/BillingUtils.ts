
import { Json } from "@/integrations/supabase/types";

interface BillItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
}

export const addToBill = (
  product: Product, 
  billItems: BillItem[], 
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>,
  toast: any
) => {
  // Check if product has enough stock
  if (product.stock <= 0) {
    toast.error('This product is out of stock');
    return;
  }

  // Check if product is already in bill
  const existingItemIndex = billItems.findIndex(item => item.productId === product.id);
  
  if (existingItemIndex >= 0) {
    // Check if we have enough stock for additional item
    const currentQuantity = billItems[existingItemIndex].quantity;
    
    if (currentQuantity >= product.stock) {
      toast.error('Not enough stock available');
      return;
    }
    
    // Increment quantity
    const updatedItems = [...billItems];
    updatedItems[existingItemIndex].quantity += 1;
    setBillItems(updatedItems);
  } else {
    // Add new item
    setBillItems([
      ...billItems,
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }
    ]);
  }

  toast.success(`Added ${product.name} to bill`);
};

export const updateItemQuantity = (
  index: number, 
  quantity: number, 
  billItems: BillItem[], 
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>,
  products: Product[],
  toast: any,
  removeItem: (index: number) => void
) => {
  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    removeItem(index);
    return;
  }

  const product = products.find(p => p.id === billItems[index].productId);
  
  if (product && quantity > product.stock) {
    toast.error(`Only ${product.stock} in stock`);
    return;
  }

  const updatedItems = [...billItems];
  updatedItems[index].quantity = quantity;
  setBillItems(updatedItems);
};

export const removeItem = (
  index: number,
  billItems: BillItem[],
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>
) => {
  setBillItems(billItems.filter((_, i) => i !== index));
};

export const clearBill = (
  billItems: BillItem[],
  setBillItems: React.Dispatch<React.SetStateAction<BillItem[]>>,
  toast: any
) => {
  if (billItems.length === 0) return;
  
  if (window.confirm('Are you sure you want to clear the current bill?')) {
    setBillItems([]);
    toast.info('Bill cleared');
  }
};

export const getTotalAmount = (billItems: BillItem[]) => {
  return billItems.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const downloadReceipt = (
  receiptRef: React.RefObject<HTMLDivElement>,
  receiptData: any
) => {
  if (!receiptRef.current || !receiptData) return;

  const receiptContent = receiptRef.current.innerHTML;
  const blob = new Blob([`
    <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .receipt { max-width: 400px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; }
          .items { margin: 20px 0; }
          .item { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .total { font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        ${receiptContent}
      </body>
    </html>
  `], { type: 'text/html' });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `receipt-${receiptData.transaction_id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Convert BillItem[] to JSON for database storage
export const billItemsToJson = (items: BillItem[]): Json => {
  return items as unknown as Json;
};

// Parse JSON from database back to BillItem[]
export const parseTransactionItems = (items: Json): BillItem[] => {
  try {
    // If it's already in correct format, return as is
    if (Array.isArray(items) && items.length > 0 && 
        typeof items[0] === 'object' && items[0] !== null &&
        'productId' in items[0] && 
        'name' in items[0] && 
        'price' in items[0] && 
        'quantity' in items[0]) {
      return items as unknown as BillItem[];
    }
    
    // If it's a JSON string, parse it
    if (typeof items === 'string') {
      return JSON.parse(items) as BillItem[];
    }
    
    // If it's a JSON object from Supabase, try to convert it
    if (Array.isArray(items)) {
      return items.map(item => {
        const objItem = item as any;
        return {
          productId: objItem?.productId || objItem?.product_id || '',
          name: objItem?.name || '',
          price: typeof objItem?.price === 'number' ? objItem.price : 0,
          quantity: typeof objItem?.quantity === 'number' ? objItem.quantity : 0
        };
      });
    }
    
    // Fallback
    return [];
  } catch (e) {
    console.error("Error parsing transaction items:", e);
    return [];
  }
};

export type { BillItem, Product };
