
import React from "react";
import { CircleCheck, Clock, DollarSign, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboards/DashboardCards";

const CashierDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cashier Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your daily transactions and performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value="$524.50"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="15 transactions"
        />
        <StatCard
          title="Transaction Count"
          value="15"
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          description="Today's total"
        />
        <StatCard
          title="Completed"
          value="14"
          icon={<CircleCheck className="h-4 w-4 text-muted-foreground" />}
          description="Successfully processed"
        />
        <StatCard
          title="Average Time"
          value="2:35"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Per transaction"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your last 5 transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">#TRX12345</p>
                  <p className="text-xs text-muted-foreground">2:15 PM - 3 items</p>
                </div>
                <span className="text-sm font-medium">$45.50</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">#TRX12344</p>
                  <p className="text-xs text-muted-foreground">1:30 PM - 1 item</p>
                </div>
                <span className="text-sm font-medium">$24.99</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">#TRX12343</p>
                  <p className="text-xs text-muted-foreground">12:45 PM - 4 items</p>
                </div>
                <span className="text-sm font-medium">$78.25</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="text-sm font-medium">#TRX12342</p>
                  <p className="text-xs text-muted-foreground">11:20 AM - 2 items</p>
                </div>
                <span className="text-sm font-medium">$36.75</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">#TRX12341</p>
                  <p className="text-xs text-muted-foreground">10:05 AM - 5 items</p>
                </div>
                <span className="text-sm font-medium">$95.00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-24 flex-col text-lg" variant="default">
                <Receipt className="h-6 w-6 mb-2" />
                New Bill
              </Button>
              <Button className="h-24 flex-col text-lg" variant="outline">
                <DollarSign className="h-6 w-6 mb-2" />
                Cash In
              </Button>
              <Button className="h-24 flex-col text-lg" variant="outline">
                <Clock className="h-6 w-6 mb-2" />
                View History
              </Button>
              <Button className="h-24 flex-col text-lg" variant="outline">
                <CircleCheck className="h-6 w-6 mb-2" />
                End Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashierDashboard;
