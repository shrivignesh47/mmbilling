
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { Transaction } from "@/components/billing/types";
import { formatPaymentMethod } from "@/components/utils/BillingUtils";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReceiptDialog from "@/components/billing/ReceiptDialog";
import * as XLSX from "xlsx"; // Import XLSX for Excel export

const TransactionHistory: React.FC = () => {
  const { profile } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthlySales, setMonthlySales] = useState<number>(0);
  const [yearlySales, setYearlySales] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchTransactions();
      fetchMonthlySales();
      fetchYearlySales();
    }
  }, [profile?.shop_id]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("shop_id", profile?.shop_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRecentTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    }
  };

  const fetchMonthlySales = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount, payment_method")
        .eq("shop_id", profile?.shop_id)
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      if (error) throw error;

      const total = data
        .filter(transaction => transaction.payment_method !== 'system')
        .reduce((sum, transaction) => sum + transaction.amount, 0);
      setMonthlySales(total);
    } catch (error) {
      console.error("Error fetching monthly sales:", error);
      toast.error("Failed to load monthly sales");
    }
  };

  const fetchYearlySales = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("shop_id", profile?.shop_id)
        .gte("created_at", new Date(new Date().getFullYear(), 0, 1).toISOString());

      if (error) throw error;

      setYearlySales(data.filter(transaction => transaction.payment_method !== 'system') || []);
    } catch (error) {
      console.error("Error fetching yearly sales:", error);
      toast.error("Failed to load yearly sales");
    }
  };

  const exportYearlySalesToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(yearlySales);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Yearly Sales");
    XLSX.writeFile(workbook, "Yearly_Sales_Report.xlsx");
  };

  const viewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsReceiptDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
        <p className="text-muted-foreground">View all transactions for your shop</p>
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Sales</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Sales</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Transaction ID</th>
                      <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                      <th className="py-3 px-4 text-right font-medium">Amount</th>
                      <th className="py-3 px-4 text-center font-medium">Payment Method</th>
                      <th className="py-3 px-4 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions
                      .filter((transaction) => transaction.payment_method !== 'system')
                      .map((transaction) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="py-3 px-4 font-mono text-xs">{transaction.transaction_id}</td>
                          <td className="py-3 px-4">{formatDate(transaction.created_at)}</td>
                          <td className="py-3 px-4 text-right">₹{transaction.amount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center capitalize">{formatPaymentMethod(transaction.payment_method)}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => viewTransaction(transaction)}
                              >
                                <Receipt className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    {recentTransactions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No recent transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                Total Monthly Sales: ₹{monthlySales.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="yearly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Yearly Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={exportYearlySalesToExcel} className="mb-4">
                Export Yearly Sales to Excel
              </Button>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium">Transaction ID</th>
                      <th className="py-3 px-4 text-left font-medium">Date & Time</th>
                      <th className="py-3 px-4 text-right font-medium">Amount</th>
                      <th className="py-3 px-4 text-center font-medium">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlySales.map((transaction) => (
                      <tr key={transaction.id} className="border-b">
                        <td className="py-3 px-4 font-mono text-xs">{transaction.transaction_id}</td>
                        <td className="py-3 px-4">{formatDate(transaction.created_at)}</td>
                        <td className="py-3 px-4 text-right">₹{transaction.amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center capitalize">{formatPaymentMethod(transaction.payment_method)}</td>
                      </tr>
                    ))}
                    {yearlySales.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          No yearly transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        receiptData={selectedTransaction}
        onDownload={() => {
          // Implement download functionality
          toast.error("Download functionality not implemented");
        }}
      />
    </div>
  );
};

export default TransactionHistory;
