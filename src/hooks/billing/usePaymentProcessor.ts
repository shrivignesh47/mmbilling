
// Note: Creating this file to intercept payment processing and add stock reduction logic
import { supabase } from "@/integrations/supabase/client";
import { BillItem, Transaction } from "@/components/billing/types";

// Function to update product stock after a successful transaction
export const updateProductStock = async (items: BillItem[]) => {
  // Process each item in the transaction
  for (const item of items) {
    try {
      // Get the current stock for this product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', item.productId)
        .single();
      
      if (productError || !productData) {
        console.error(`Failed to retrieve stock for product ${item.productId}:`, productError);
        continue;
      }
      
      // Calculate new stock
      const currentStock = productData.stock;
      const newStock = Math.max(0, currentStock - item.quantity); // Ensure stock doesn't go below 0
      
      // Update the product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.productId);
      
      if (updateError) {
        console.error(`Failed to update stock for product ${item.productId}:`, updateError);
      } else {
        console.log(`Updated stock for ${item.name} from ${currentStock} to ${newStock}`);
      }
      
      // Update the sales count for the product
      await supabase.rpc('increment_sales', { 
        p_id: item.productId, 
        amount: item.quantity 
      });
      
    } catch (error) {
      console.error(`Error updating stock for product ${item.productId}:`, error);
    }
  }
};

// Track inventory changes for reporting
export const logInventoryChange = async (
  items: BillItem[],
  shopId: string,
  transactionId: string
) => {
  for (const item of items) {
    try {
      await supabase
        .from('inventory_logs')
        .insert({
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          action: 'sale',
          shop_id: shopId
        });
    } catch (error) {
      console.error(`Failed to log inventory change for ${item.name}:`, error);
    }
  }
};
