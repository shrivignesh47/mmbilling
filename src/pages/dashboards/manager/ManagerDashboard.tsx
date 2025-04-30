
import React, { useState, useEffect } from "react";
import { DollarSign, PackageCheck, PackageX, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboards/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  shop_id: string;
  sales_count: number;
}

interface InventoryAlert {
  type: 'out_of_stock' | 'low_stock' | 'restock';
  name: string;
  message: string;
  time: string;
}

interface InventoryLog {
  id: string;
  product_name: string;
  quantity: number;
  action: string;
  created_at: string;
}

const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [todaySales, setTodaySales] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [inStockCount, setInStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.shop_id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch products for this shop
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', profile.shop_id);
        
        if (productsError) throw productsError;
        
        // Calculate product statistics
        const totalProductsCount = products?.length || 0;
        const inStock = products?.filter(p => p.stock > 5)?.length || 0;
        const lowStock = products?.filter(p => p.stock > 0 && p.stock <= 5)?.length || 0;
        
        setTotalProducts(totalProductsCount);
        setInStockCount(inStock);
        setLowStockCount(lowStock);
        
        // Get today's transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .gte('created_at', today.toISOString());
        
        if (transactionsError) throw transactionsError;
        
        // Calculate sales data
        const salesTotal = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
        setTodaySales(salesTotal);
        setTransactionCount(transactions?.length || 0);
        
        // Get top selling products
        const { data: topSellingProducts, error: topProductsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .order('sales_count', { ascending: false })
          .limit(4);
          
        if (topProductsError) throw topProductsError;
        setTopProducts(topSellingProducts || []);
        
        // Get inventory alerts
        const alerts: InventoryAlert[] = [];
        
        // Out of stock items
        const outOfStock = products?.filter(p => p.stock === 0) || [];
        for (const product of outOfStock.slice(0, 2)) {
          alerts.push({
            type: 'out_of_stock',
            name: product.name,
            message: 'Out of stock',
            time: 'Action required'
          });
        }
        
        // Low stock items
        const lowStockItems = products?.filter(p => p.stock > 0 && p.stock <= 5) || [];
        for (const product of lowStockItems.slice(0, 2)) {
          alerts.push({
            type: 'low_stock',
            name: product.name,
            message: `Only ${product.stock} units remaining`,
            time: 'Order soon'
          });
        }
        
        // Recently restocked - use inventory_logs table
        const { data: restockData, error: restockError } = await supabase
          .from('inventory_logs')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .eq('action', 'restock')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (!restockError && restockData && restockData.length > 0) {
          const restock = restockData[0];
          alerts.push({
            type: 'restock',
            name: restock.product_name,
            message: `${restock.quantity} units added`,
            time: new Date(restock.created_at).toLocaleDateString()
          });
        }
        
        setInventoryAlerts(alerts);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.shop_id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your shop's performance and inventory.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/4 bg-muted rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Sales"
            value={`$${todaySales.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description={`${transactionCount} transactions`}
          />
          <StatCard
            title="Total Products"
            value={totalProducts.toString()}
            icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            description="In inventory"
          />
          <StatCard
            title="In Stock"
            value={inStockCount.toString()}
            icon={<PackageCheck className="h-4 w-4 text-muted-foreground" />}
            description="Products with healthy stock"
          />
          <StatCard
            title="Low Stock"
            value={lowStockCount.toString()}
            icon={<PackageX className="h-4 w-4 text-muted-foreground" />}
            description="Products needing restock"
          />
        </div>
      )}

      {!loading && !profile?.shop_id && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Based on sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <span className="text-sm font-medium">{product.sales_count || 0} units</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Products that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((alert, i) => (
                  <div key={i} className="border-b pb-2 last:border-0">
                    <p className={`text-sm font-medium ${
                      alert.type === 'out_of_stock' ? 'text-destructive' : 
                      alert.type === 'low_stock' ? 'text-amber-500' : 
                      'text-success'
                    }`}>
                      {alert.message}: {alert.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{alert.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No inventory alerts at this time</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
