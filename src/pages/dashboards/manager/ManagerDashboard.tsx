
import React, { useState, useEffect } from "react";
import {
  DollarSign,
  PackageCheck,
  PackageX,
  ShoppingBag,
  TrendingUp,
  Eye,
  Download,
  Plus,

} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

// Import Recharts components
import {
  ResponsiveContainer,
  LineChart, // Now this is the only LineChart import
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart, // Now this is the only BarChart import
  Bar,
  PieChart, // Now this is the only PieChart import
  Pie,
  Cell
} from "recharts";

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

interface SalesData {
  date: string;
  sales: number;
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
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [salesTrendData, setSalesTrendData] = useState<SalesData[]>([]);
  const [productCategoryDistribution, setProductCategoryDistribution] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'alerts'>('overview');

  // Fetch dashboard data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.shop_id) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Fetch products
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', profile.shop_id);
        
        if (productsError) throw productsError;
        
        const totalProductsCount = products?.length || 0;
        const inStock = products?.filter(p => p.stock > 5)?.length || 0;
        const lowStock = products?.filter(p => p.stock > 0 && p.stock <= 5)?.length || 0;
        
        setTotalProducts(totalProductsCount);
        setInStockCount(inStock);
        setLowStockCount(lowStock);
        
        // Calculate category distribution
        const categoryCounts = products?.reduce((acc, product) => {
          acc[product.category] = (acc[product.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        setProductCategoryDistribution(
          Object.entries(categoryCounts || {}).map(([name, value]) => ({ name, value }))
        );

        // Today’s Transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .gte('created_at', today.toISOString());
        
        if (transactionsError) throw transactionsError;
        
        const salesTotal = transactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
        setTodaySales(salesTotal);
        setTransactionCount(transactions?.length || 0);

        // Generate sales trend data for last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: weeklyTransactions, error: weeklyError } = await supabase
          .from('transactions')
          .select('amount, created_at')
          .eq('shop_id', profile.shop_id)
          .gte('created_at', sevenDaysAgo.toISOString());
        
        if (weeklyError) throw weeklyError;
        
        // Group transactions by date
        const dailySales = weeklyTransactions?.reduce((acc, tx) => {
          const date = new Date(tx.created_at).toLocaleDateString();
          acc[date] = (acc[date] || 0) + tx.amount;
          return acc;
        }, {} as Record<string, number>);
        
        setSalesTrendData(
          Object.entries(dailySales || {}).map(([date, sales]) => ({ date, sales }))
        );

        // Top Selling Products
        const { data: topSellingProducts, error: topProductsError } = await supabase
          .from('products')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .order('sales_count', { ascending: false })
          .limit(4);
        
        if (topProductsError) throw topProductsError;
        setTopProducts(topSellingProducts || []);

        // Inventory Alerts
        const alerts: InventoryAlert[] = [];
        const outOfStock = products?.filter(p => p.stock === 0) || [];
        
        for (const product of outOfStock.slice(0, 2)) {
          alerts.push({
            type: 'out_of_stock',
            name: product.name,
            message: 'Out of stock',
            time: 'Action required'
          });
        }
        
        const lowStockItems = products?.filter(p => p.stock > 0 && p.stock <= 5) || [];
        
        for (const product of lowStockItems.slice(0, 2)) {
          alerts.push({
            type: 'low_stock',
            name: product.name,
            message: `Only ${product.stock} units remaining`,
            time: 'Order soon'
          });
        }
        
        // Recently Restocked Items
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

        // Get inventory logs
        const { data: logs, error: logsError } = await supabase
          .from('inventory_logs')
          .select('*')
          .eq('shop_id', profile.shop_id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (logsError) throw logsError;
        setInventoryLogs(logs || []);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [profile?.shop_id]);

  // Filtered Products
  const filteredProducts = topProducts.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Color scheme for charts
  const COLORS = ['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your shop's performance and inventory.
        </p>
      </div>
      
      {/* No Shop Assigned Alert */}
      {!loading && !profile?.shop_id && (
        <Card className="border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900">
          <CardContent className="pt-6">
            <p className="text-sm text-red-700 dark:text-red-400">
              You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Stats Section */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-1/4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Sales"
            value={`₹${todaySales.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description={`${transactionCount} transactions`}
            trend="+12% from last week"
          />
          <StatCard
            title="Total Products"
            value={totalProducts.toString()}
            icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
            description="In inventory"
            trend="+5% from last month"
          />
          <StatCard
            title="In Stock"
            value={inStockCount.toString()}
            icon={<PackageCheck className="h-4 w-4 text-muted-foreground" />}
            description="Products with healthy stock"
            trend="↑ 3 items restocked"
          />
          <StatCard
            title="Low Stock"
            value={lowStockCount.toString()}
            icon={<PackageX className="h-4 w-4 text-muted-foreground" />}
            description="Products needing restock"
            trend="↓ 1 item out of stock"
          />
        </div>
      )}
      
      {/* Tabs */}
      {!loading && profile?.shop_id && (
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'overview' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('products')} 
              className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'products' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveTab('alerts')} 
              className={`py-2 px-4 font-medium border-b-2 ${
                activeTab === 'alerts' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              Alerts
            </button>
          </div>
          <div className="relative w-48">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            <Eye className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      {/* Tab Content */}
      {!loading && profile?.shop_id && activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sales Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Activity</CardTitle>
              <CardDescription>Overview of weekly sales trends</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      data={salesTrendData}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#4F46E5"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Inventory Logs</CardTitle>
              <CardDescription>Last 5 actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px] pr-4">
                <ul className="space-y-3">
                  {inventoryLogs.map(log => (
                    <li key={log.id} className="flex items-center justify-between py-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          log.action === 'restock' ? 'bg-green-500' : 
                          log.action === 'sale' ? 'bg-red-500' :
                          log.action === 'initial' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{log.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant={log.action === 'restock' ? 'default' : 
                               log.action === 'sale' ? 'destructive' : 
                               log.action === 'initial' ? 'secondary' : 'outline'}
                      >
                        {log.action === 'restock' ? '+' : '-'}{Math.abs(Number(log.quantity))} units
                      </Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View All Logs
              </Button>
            </CardFooter>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Distribution of products by category</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productCategoryDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {productCategoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Inventory Movement */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Movement</CardTitle>
              <CardDescription>Restocks vs Sales over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Last 7 Days',
                      restocks: inventoryLogs.filter(log => log.action === 'restock').length,
                      sales: inventoryLogs.filter(log => log.action === 'sale').length
                    }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="restocks" fill="#10B981" />
                  <Bar dataKey="sales" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Tab */}
      {!loading && profile?.shop_id && activeTab === 'products' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Top Selling Products</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
            <CardDescription>
              Based on sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, i) => (
                  <div key={product.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{product.sales_count || 0} units sold</span>
                      <Progress 
                        value={Math.min((product.sales_count / Math.max(...topProducts.map(p => p.sales_count))) * 100, 100)} 
                        className="mt-1 h-2" 
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No matching products found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Tab */}
      {!loading && profile?.shop_id && activeTab === 'alerts' && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory Alerts</CardTitle>
            <CardDescription>
              Products that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {inventoryAlerts.length > 0 ? (
                inventoryAlerts.map((alert, i) => (
                  <div key={i} className="mb-4">
                    <div className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                      alert.type === 'out_of_stock' ? 'border-destructive bg-destructive/5' :
                      alert.type === 'low_stock' ? 'border-yellow-500 bg-yellow-500/5' :
                      'border-green-500 bg-green-500/5'
                    }`}>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{alert.message}: {alert.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                      <Button size="icon" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No inventory alerts at this time</p>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

// Extended StatCard Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, trend }) => {
  return (
    <Card className="group hover:shadow-md transition-shadow duration-300 border border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="font-bold text-xl">{value}</div>
          <div className="rounded-md bg-muted p-2 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 transition-colors">
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div className="flex items-center mt-2">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-xs text-emerald-500 ml-1">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ManagerDashboard;