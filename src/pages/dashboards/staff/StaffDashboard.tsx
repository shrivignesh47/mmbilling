
// Remove next/navigation import
import React, { useState, useEffect } from "react";
import { CircleCheck, Clock, Receipt, Package, Clipboard, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboards/DashboardCards";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const StaffDashboard: React.FC = () => {
  // Remove router declaration
  const { profile } = useAuth();
  const [inventoryCount, setInventoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  // Add state declarations at the top with other states
  const [todaysSales, setTodaysSales] = useState(0);
  const [realtimeUsers, setRealtimeUsers] = useState(0);

  // Define the hasPermission function
  const hasPermission = (permission: string) => {
    return profile?.custom_permissions?.includes(permission);
  };

  useEffect(() => {
    let channels: ReturnType<typeof supabase.channel>[] = [];
    
    if (profile?.shop_id) {
      fetchDashboardData();
      channels = setupRealtimeSubscriptions();
    }

    return () => {
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [profile?.shop_id]);

  const setupRealtimeSubscriptions = () => {
    const channels = [];
    
    // Subscribe to transactions table for real-time sales
    const transactionsSub = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `shop_id=eq.${profile?.shop_id}`,
        },
        async () => {
          // Update today's sales count
          const today = new Date().toISOString().split('T')[0];
          const { data } = await supabase
            .from('transactions')
            .select('amount')
            .eq('shop_id', profile?.shop_id)
            .gte('created_at', today);
          
          setTodaysSales(data?.length || 0);
        }
      )
      .subscribe();

    channels.push(transactionsSub);

    // Subscribe to active users for real-time count
    const usersSub = supabase
      .channel('online_users')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `shop_id=eq.${profile?.shop_id} and last_seen_at>eq.${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`,
        },
        async () => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('shop_id', profile?.shop_id)
            .gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
          
          if (!error) {
            setRealtimeUsers(data?.length || 0);
          }
        }
      )
      .subscribe();

    channels.push(usersSub);

    return channels;
  };

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

  // Remove Task Completion card and update Quick Actions
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome {profile?.name}! Here's your overview for today at {profile?.shop_name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Today's Sales"
          value={todaysSales.toString()}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description="Orders today"
          trend={{ value: todaysSales, isPositive: true }}
        />
        <StatCard
          title="Active Users"
          value={realtimeUsers.toString()}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Currently online"
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
                <Button 
                className="h-20 flex-col" 
                variant="outline"
                onClick={() => window.location.href = '/staff/products'}
              >
                <Package className="h-5 w-5 mb-1" />
                View Products
              </Button>
            )}
            {hasPermission('sell_products') && (
              <Button 
                className="h-20 flex-col" 
                variant="outline"
                disabled
              >
                <Receipt className="h-5 w-5 mb-1" />
                Coming Soon
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
