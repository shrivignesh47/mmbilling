
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";
import { Transaction } from "./types";
import { formatPaymentMethod } from "@/components/utils/BillingUtils";

interface TransactionHistoryProps {
  recentTransactions: Transaction[];
  viewTransaction: (transaction: Transaction) => void;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  recentTransactions,
  viewTransaction
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Tabs defaultValue="recent">
      <TabsList>
        <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
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
                  {recentTransactions.map((transaction) => (
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
    </Tabs>
  );
};

export default TransactionHistory;
