import React, { useState, useEffect } from "react";
import { CircleCheck, Clock, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboards/DashboardCards";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { logAuthEvent } from "@/components/auth/AuthEventLogger";

const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [todaySales, setTodaySales] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [averageTime, setAverageTime] = useState("0:00");
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Log login event when dashboard is first loaded
    if (profile?.id) {
      logAuthEvent(profile.id, 'login');
    }
  }, [profile?.shop_id]);

  const fetchDashboardData = async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Fetch today's transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("shop_id", profile.shop_id)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Calculate dashboard metrics
      const totalSales = transactions?.reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;
      const txCount = transactions?.length || 0;
      
      // For demo purposes, we'll assume all transactions are completed
      const completed = txCount;
      
      // Calculate average time (mock data for now)
      // In a real app, you would need to track start and end time of transactions
      setAverageTime(txCount > 0 ? "2:45" : "0:00");
      
      // Get recent transactions (last 5)
      const recentTx = transactions?.slice(0, 5) || [];
      
      // Update state
      setTodaySales(totalSales);
      setTransactionCount(txCount);
      setCompletedCount(completed);
      setRecentTransactions(recentTx);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handler functions for quick actions
  const handleNewBill = () => {
    navigate("/cashier/billing");
  };

  const handleCashIn = () => {
    // For demo purposes, we'll just alert
    toast.info("Cash In functionality will be implemented soon");
  };

  const handleViewHistory = () => {
    // Navigate to a transactions history page (to be implemented)
    toast.info("Transaction history will be implemented soon");
  };

  const handleEndShift = async () => {
    // Log the end of shift and record logout event
    if (window.confirm("Are you sure you want to end your shift?")) {
      try {
        if (profile?.id) {
          // Log the logout event
          await logAuthEvent(profile.id, 'logout');
          toast.success("Shift ended successfully");
        }
      } catch (error) {
        console.error("Error ending shift:", error);
        toast.error("Failed to end shift");
      }
    }
  };

  // Format currency to Rupees
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  // Format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Count items in a transaction
  const countItems = (items: any) => {
    if (!items) return 0;
    
    try {
      if (typeof items === 'string') {
        items = JSON.parse(items);
      }
      
      if (Array.isArray(items)) {
        return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      }
      
      return 0;
    } catch (e) {
      return 0;
    }
  };

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
          value={formatCurrency(todaySales)}
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          description={`${transactionCount} transactions`}
        />
        <StatCard
          title="Transaction Count"
          value={transactionCount.toString()}
          icon={<Receipt className="h-4 w-4 text-muted-foreground" />}
          description="Today's total"
        />
        <StatCard
          title="Completed"
          value={completedCount.toString()}
          icon={<CircleCheck className="h-4 w-4 text-muted-foreground" />}
          description="Successfully processed"
        />
        <StatCard
          title="Average Time"
          value={averageTime}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Per transaction"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your last {recentTransactions.length} transactions
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
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">#{tx.transaction_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(tx.created_at)} - {countItems(tx.items)} items
                        </p>
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(Number(tx.amount))}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No transactions yet today
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
              Frequently used functions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button className="h-24 flex-col text-lg" variant="default" onClick={handleNewBill}>
                <Receipt className="h-6 w-6 mb-2" />
                New Bill
              </Button>
              <Button className="h-24 flex-col text-lg" variant="outline" onClick={handleCashIn}>
                <Receipt className="h-6 w-6 mb-2" />
                Cash In
              </Button>
              <Button className="h-24 flex-col text-lg" variant="outline" onClick={handleViewHistory}>
                <Clock className="h-6 w-6 mb-2" />
                View History
              </Button>
              <Button className="h-24 flex-col text-lg" variant="outline" onClick={handleEndShift}>
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
