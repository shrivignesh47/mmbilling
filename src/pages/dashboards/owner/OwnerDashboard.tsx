
import React, { useState, useEffect } from "react";
import { Building2, CreditCard, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboards/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ShopSummary {
  name: string;
  revenue: number;
  trend: number;
}

const OwnerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalShops, setTotalShops] = useState(0);
  const [activeShops, setActiveShops] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [managerCount, setManagerCount] = useState(0);
  const [cashierCount, setCashierCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<{action: string, description: string, date: string}[]>([]);
  const [topShops, setTopShops] = useState<ShopSummary[]>([]);
  // Add state for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState<ShopSummary | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Get shop stats
        const { data: shops, error: shopsError } = await supabase
          .from('shops')
          .select('*');
        
        if (shopsError) throw shopsError;
        
        setTotalShops(shops?.length || 0);
        setActiveShops(shops?.filter(shop => shop.is_active)?.length || 0);
        
        // Get user stats
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('role');
        
        if (usersError) throw usersError;
        
        setTotalUsers(users?.length || 0);
        setManagerCount(users?.filter(user => user.role === 'manager')?.length || 0);
        setCashierCount(users?.filter(user => user.role === 'cashier')?.length || 0);

        // Create some sample data for shops (in a real app, this would come from your database)
        setTopShops([
          { name: "Main Branch", revenue: 12500, trend: 18 },
          { name: "Downtown Location", revenue: 10200, trend: 12 },
          { name: "West Side Store", revenue: 8750, trend: 5 },
          { name: "East End Shop", revenue: 7300, trend: -2 },
        ]);

        // Set recent activity
        const now = new Date();
        setRecentActivity([
          {
            action: "User created",
            description: "New manager account created",
            date: "Today"
          },
          {
            action: "Shop updated", 
            description: "Shop status changed to active",
            date: "Yesterday"
          },
          {
            action: "Settings changed",
            description: "System preferences updated",
            date: "Apr 28, 2025"
          }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleShopClick = (shop: ShopSummary) => {
    setSelectedShop(shop);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {profile?.name || "Owner"}! Here's your system overview.
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
            title="Total Shops"
            value={totalShops.toString()}
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            description={`${activeShops} active shops`}
            trend={activeShops > 0 ? { value: Math.round((activeShops / totalShops) * 100), isPositive: true } : undefined}
          />
          <StatCard
            title="Total Revenue"
            value="$38,731.89"
            icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            description="Monthly revenue"
            trend={{ value: 8, isPositive: true }}
          />
          <StatCard
            title="Active Subscriptions"
            value={activeShops.toString()}
            icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            description="Shop subscriptions"
          />
          <StatCard
            title="Total Users"
            value={totalUsers.toString()}
            icon={<Users className="h-4 w-4 text-muted-foreground" />}
            description={`${managerCount} managers, ${cashierCount} cashiers`}
          />
        </div>
      )}

      {!loading && totalShops === 0 && (
        <Alert>
          <AlertDescription>
            No shops found in the system. Start by adding a shop in the Shops section.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across all shops
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((item, i) => (
                  <div key={i} className="border-b pb-2 last:border-0">
                    <p className="text-sm font-medium">{item.action}: {item.description}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity to display</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Shops</CardTitle>
            <CardDescription>
              Based on monthly revenue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topShops.map((shop, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between border-b pb-2 last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2"
                  onClick={() => handleShopClick(shop)}
                >
                  <div>
                    <p className="text-sm font-medium">{shop.name}</p>
                    <p className="text-xs text-muted-foreground">${shop.revenue.toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-medium ${
                    shop.trend >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    {shop.trend >= 0 ? "+" : ""}{shop.trend}%
                  </span>
                </div>
              ))}
              
              {topShops.length === 0 && (
                <p className="text-sm text-muted-foreground">No shop data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedShop?.name || 'Shop Details'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedShop && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Monthly Revenue</p>
                  <p className="text-2xl font-bold">${selectedShop.revenue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Growth Trend</p>
                  <p className={`text-lg font-semibold ${selectedShop.trend >= 0 ? "text-success" : "text-destructive"}`}>
                    {selectedShop.trend >= 0 ? "+" : ""}{selectedShop.trend}%
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    More detailed analytics for this shop will be available in a future update.
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerDashboard;
