
import React, { useState, useEffect } from "react";
import { CircleCheck, Clock, Receipt, Package, Clipboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboards/DashboardCards";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StaffDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Define the hasPermission function
  const hasPermission = (permission: string) => {
    return profile?.custom_permissions?.includes(permission);
  };

  useEffect(() => {
    if (profile?.shop_id) {
      fetchDashboardData();
    }
  }, [profile?.shop_id]);

  const fetchDashboardData = async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    try {
      // Fetch product count
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('shop_id', profile.shop_id);
      
      if (productsError) throw productsError;
      setProductCount(products?.length || 0);
      
      // Fetch inventory logs
      const { data: logs, error: logsError } = await supabase
        .from('inventory_logs')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (logsError) throw logsError;
      setRecentActivities(logs || []);
      
      // Calculate total inventory
      const totalInventory = products?.reduce((sum, _) => sum + 1, 0) || 0;
      setInventoryCount(totalInventory);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3cm font-bold tracking-tight">Staff Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome {profile?.name}! Here's your overview for today at {profile?.shop_name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Products"
          value={productCount.toString()}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
          description="Total products"
        />
        <StatCard
          title="Inventory Items"
          value={inventoryCount.toString()}
          icon={<Clipboard className="h-4 w-4 text-muted-foreground" />}
          description="Items in inventory"
        />
        <StatCard
          title="Task Completion"
          value="85%"
          icon={<CircleCheck className="h-4 w-4 text-muted-foreground" />}
          description="Weekly average"
          trend={{ value: 7, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest inventory changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex animate-pulse items-center justify-between border-b pb-2">
                    <div>
                      <div className="h-4 w-24 bg-muted rounded"></div>
                      <div className="h-3 w-16 bg-muted rounded mt-1"></div>
                    </div>
                    <div className="h-4 w-16 bg-muted rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">{activity.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.action}: {activity.quantity} items
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(activity.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activities
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common staff tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {hasPermission('view_products') && (
                <Button className="h-20 flex-col" variant="outline">
                  <Package className="h-5 w-5 mb-1" />
                  View Products
                </Button>
              )}
              {hasPermission('sell_products') && (
                <Button className="h-20 flex-col" variant="outline">
                  <Receipt className="h-5 w-5 mb-1" />
                  Sell Products
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDashboard;
