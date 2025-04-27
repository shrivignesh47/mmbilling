
import React from "react";
import { DollarSign, PackageCheck, PackageX, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboards/DashboardCards";

const ManagerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manager Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your shop's performance and inventory.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value="$1,250.00"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="32 transactions"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Total Products"
          value="245"
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
          description="12 categories"
        />
        <StatCard
          title="In Stock"
          value="198"
          icon={<PackageCheck className="h-4 w-4 text-muted-foreground" />}
          description="80% of inventory"
          trend={{ value: 2, isPositive: true }}
        />
        <StatCard
          title="Low Stock"
          value="47"
          icon={<PackageX className="h-4 w-4 text-muted-foreground" />}
          description="Below threshold"
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Top Selling Products</CardTitle>
            <CardDescription>
              Based on sales volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Wireless Headphones</p>
                  <p className="text-xs text-muted-foreground">Electronics</p>
                </div>
                <span className="text-sm font-medium">28 units</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Premium T-Shirt</p>
                  <p className="text-xs text-muted-foreground">Apparel</p>
                </div>
                <span className="text-sm font-medium">22 units</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Smart Watch</p>
                  <p className="text-xs text-muted-foreground">Electronics</p>
                </div>
                <span className="text-sm font-medium">15 units</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Water Bottle</p>
                  <p className="text-xs text-muted-foreground">Accessories</p>
                </div>
                <span className="text-sm font-medium">14 units</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Inventory Alerts</CardTitle>
            <CardDescription>
              Products that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-2">
                <p className="text-sm font-medium text-destructive">Out of stock: Premium Leather Wallet</p>
                <p className="text-xs text-muted-foreground">Last sold 3 hours ago</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm font-medium text-amber-500">Low stock: Bluetooth Speaker</p>
                <p className="text-xs text-muted-foreground">Only 5 units remaining</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm font-medium text-amber-500">Low stock: Designer Sunglasses</p>
                <p className="text-xs text-muted-foreground">Only 3 units remaining</p>
              </div>
              <div>
                <p className="text-sm font-medium text-success">Restocked: Laptop Sleeve</p>
                <p className="text-xs text-muted-foreground">30 units added yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManagerDashboard;
