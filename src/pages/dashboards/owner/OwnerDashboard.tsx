
import React from "react";
import { Building2, CreditCard, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboards/DashboardCards";

const OwnerDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Owner Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your billing system and all shops.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231.89"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Monthly revenue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Shops"
          value="12"
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          description="Across 4 locations"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Active Subscriptions"
          value="10"
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
          description="2 pending renewal"
        />
        <StatCard
          title="Total Users"
          value="48"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="8 managers, 40 cashiers"
        />
      </div>

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
              <div className="border-b pb-2">
                <p className="text-sm font-medium">New shop added: Downtown Branch</p>
                <p className="text-xs text-muted-foreground">2 hours ago by Admin</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm font-medium">Subscription renewed: Main Street Shop</p>
                <p className="text-xs text-muted-foreground">Yesterday at 4:30 PM</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm font-medium">New manager assigned: Jane Smith</p>
                <p className="text-xs text-muted-foreground">Apr 25, 2023</p>
              </div>
              <div>
                <p className="text-sm font-medium">Invoice generated: $1,240.00</p>
                <p className="text-xs text-muted-foreground">Apr 24, 2023</p>
              </div>
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
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Main Street Shop</p>
                  <p className="text-xs text-muted-foreground">$12,500.00</p>
                </div>
                <span className="text-xs font-medium text-success">+18%</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Downtown Branch</p>
                  <p className="text-xs text-muted-foreground">$10,200.00</p>
                </div>
                <span className="text-xs font-medium text-success">+12%</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">Westside Location</p>
                  <p className="text-xs text-muted-foreground">$8,750.00</p>
                </div>
                <span className="text-xs font-medium text-success">+5%</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">North Plaza</p>
                  <p className="text-xs text-muted-foreground">$7,300.00</p>
                </div>
                <span className="text-xs font-medium text-destructive">-2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OwnerDashboard;
