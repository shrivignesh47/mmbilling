import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface DamagedInventoryItem {
  product_id: string;
  quantity: number;
  created_at: string;
  reason: string;
  description: string;
}
export default function DamagedInventory() {
  const [damagedInventory, setDamagedInventory] = useState<DamagedInventoryItem[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDamagedInventory = async () => {
      try {
        const { data: damagedData, error: damagedError } = await supabase
          .from('damaged_inventory')
          .select('*');

        if (damagedError) {
          console.error('Error fetching damaged inventory:', damagedError);
          setLoading(false);
          return;
        }

        setDamagedInventory(damagedData || []);
        fetchProductNames(damagedData || []);
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchProductNames = async (damagedData: DamagedInventoryItem[]) => {
      try {
        const productIds = damagedData.map(item => item.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);

        if (productsError) {
          console.error('Error fetching product names:', productsError);
          return;
        }

        const namesMap = productsData?.reduce((acc, product) => {
          acc[product.id] = product.name;
          return acc;
        }, {} as Record<string, string>);

        setProductNames(namesMap || {});
      } catch (error) {
        console.error('Unexpected error:', error);
      }
    };

    fetchDamagedInventory();
  }, []);

  if (loading) {
    return <div>Loading damaged inventory data...</div>;
  }

  if (damagedInventory.length === 0) {
    return <div>No damaged inventory records found.</div>;
  }

  return (
    <div>
      <h2>Damaged Inventory</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-3 px-4 text-left font-medium">Product Name</th>
            <th className="py-3 px-4 text-right font-medium">Quantity</th>
            <th className="py-3 px-4 text-left font-medium">Created At</th>
            <th className="py-3 px-4 text-left font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {damagedInventory.map((item) => (
            <tr key={item.product_id} className="border-b">
              <td className="py-3 px-4">{productNames[item.product_id] || 'Unknown'}</td>
              <td className="py-3 px-4 text-right">{item.quantity}</td>
              <td className="py-3 px-4">{new Date(item.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
