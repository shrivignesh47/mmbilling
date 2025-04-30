import React, { useState, useEffect, useRef } from "react";
import { 
  Package, 
  Plus, 
  Trash2, 
  CreditCard, 
  Receipt, 
  Search,
  Download,
  Check,
  X
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  addToBill, 
  updateItemQuantity as updateItemQty, 
  removeItem as removeCartItem, 
  clearBill as clearCart,
  getTotalAmount,
  downloadReceipt as downloadReceiptFile,
  billItemsToJson,
  parseTransactionItems,
  type BillItem,
  type Product
} from "@/components/utils/BillingUtils";
import { Json } from "@/integrations/supabase/types";

interface Transaction {
  id: string;
  transaction_id: string;
  created_at: string;
  amount: number;
  items: BillItem[];
  payment_method: string;
}

const Billing = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [receiptData, setReceiptData] = useState<Transaction | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [dailySaleCount, setDailySaleCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchProducts();
      fetchRecentTransactions();
      fetchDailySaleCount();
      fetchDailyRevenue();
    }
  }, [profile?.shop_id]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = products.filter(
        product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    if (!profile?.shop_id) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select('*')
        .eq('shop_id', profile.shop_id)
        .gt('stock', 0)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const typedProducts: Product[] = data.map(product => ({
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          category: product.category || '',
          sku: product.sku || ''
        }));
        
        setProducts(typedProducts);
        setFilteredProducts(typedProducts);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchRecentTransactions = async () => {
    if (!profile?.shop_id) return;

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        // Type safety for the returned data
        const typedTransactions: Transaction[] = data.map(transaction => ({
          id: transaction.id,
          transaction_id: transaction.transaction_id,
          created_at: transaction.created_at,
          amount: transaction.amount,
          items: parseTransactionItems(transaction.items),
          payment_method: transaction.payment_method
        }));
        
        setRecentTransactions(typedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchDailySaleCount = async () => {
    try {
      if (!profile?.shop_id) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('shop_id', profile.shop_id)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      // Correctly extract the count value
      if (typeof count === 'number') {
        setDailySaleCount(count);
      } else {
        setDailySaleCount(0);
        console.warn("Daily sale count returned an unexpected type:", count);
      }
    } catch (error) {
      console.error('Error fetching daily sale count:', error);
      setDailySaleCount(0);
    }
  };

  const fetchDailyRevenue = async () => {
    try {
      if (!profile?.shop_id) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('shop_id', profile.shop_id)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      // Calculate the total amount from data
      if (Array.isArray(data)) {
        const totalAmount = data.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
        setDailyRevenue(totalAmount);
      } else {
        setDailyRevenue(0);
        console.warn("Daily revenue data returned an unexpected type:", data);
      }
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      setDailyRevenue(0);
    }
  };

  const handleAddToBill = (product: Product) => {
    addToBill(product, billItems, setBillItems, toast);
  };

  const handleUpdateItemQuantity = (index: number, quantity: number) => {
    updateItemQty(index, quantity, billItems, setBillItems, products, toast, handleRemoveItem);
  };

  const handleRemoveItem = (index: number) => {
    removeCartItem(index, billItems, setBillItems);
  };

  const handleClearBill = () => {
    clearCart(billItems, setBillItems, toast);
  };

  const handleCheckout = async () => {
    if (billItems.length === 0) {
      toast.error('Cannot checkout an empty bill');
      return;
    }

    if (!profile?.shop_id) {
      toast.error('Shop ID is required');
      return;
    }

    setIsPaymentProcessing(true);

    try {
      // Generate a transaction ID
      const transactionId = `INV-${Date.now().toString().slice(-8)}`;

      // Create the transaction record
      const transactionData = {
        shop_id: profile.shop_id,
        cashier_id: profile.id,
        transaction_id: transactionId,
        amount: getTotalAmount(billItems),
        items: billItemsToJson(billItems),
        payment_method: paymentMethod
      };

      const { data: transactionResult, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionData)
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update product stock and sales count
      for (const item of billItems) {
        const { error: stockError } = await supabase
          .from("products")
          .update({ 
            stock: supabase.rpc('decrement_stock', { 
              p_id: item.productId, 
              amount: item.quantity 
            }),
            sales_count: supabase.rpc('increment_sales', {
              p_id: item.productId,
              amount: item.quantity
            })
          })
          .eq('id', item.productId);

        if (stockError) {
          console.error(`Error updating stock for product ${item.productId}:`, stockError);
        }
      }

      // Show success message
      toast.success('Payment processed successfully');
      
      if (transactionResult) {
        setReceiptData({
          id: transactionResult.id,
          transaction_id: transactionResult.transaction_id,
          created_at: transactionResult.created_at,
          amount: transactionResult.amount,
          items: parseTransactionItems(transactionResult.items),
          payment_method: transactionResult.payment_method
        });
        setIsReceiptDialogOpen(true);
      }
      
      // Reset the bill
      setBillItems([]);
      setIsCheckoutDialogOpen(false);
      
      // Refresh product list and transactions
      fetchProducts();
      fetchRecentTransactions();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    downloadReceiptFile(receiptRef, receiptData);
  };

  const viewTransaction = async (transaction: Transaction) => {
    setReceiptData(transaction);
    setIsReceiptDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Create and manage customer bills
        </p>
      </div>

      {!profile?.shop_id && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the manager to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Selection */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-4">
            <CardTitle>Products</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-h-[400px] overflow-y-auto p-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="p-4">
                  <h3 className="text-sm font-medium">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">
                      Stock: {product.stock}
                    </span>
                  </div>
                </div>
                <CardFooter className="border-t bg-muted/50 p-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleAddToBill(product)}
                    className="w-full"
                    disabled={product.stock <= 0}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add to Bill
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium mb-1">No products found</h3>
                <p className="text-sm text-center text-muted-foreground">
                  {products.length === 0 
                    ? "No products are available in the inventory." 
                    : "Try adjusting your search terms."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Bill */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Current Bill</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClearBill}
              disabled={billItems.length === 0}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {billItems.length > 0 ? (
              <div className="space-y-3">
                {billItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between pb-2 border-b">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => handleUpdateItemQuantity(index, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => handleUpdateItemQuantity(index, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items added yet</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="flex items-center justify-between w-full border-t pt-4">
              <span className="font-semibold text-lg">Total:</span>
              <span className="font-bold text-lg">${getTotalAmount(billItems).toFixed(2)}</span>
            </div>
            <Button 
              className="w-full" 
              size="lg"
              disabled={billItems.length === 0}
              onClick={() => setIsCheckoutDialogOpen(true)}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Checkout
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Transactions History Tab */}
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
                        <td className="py-3 px-4 text-right">${transaction.amount.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center capitalize">{transaction.payment_method}</td>
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

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Select a payment method to finalize the bill.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-bold">${getTotalAmount(billItems).toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Check className={`mr-2 h-4 w-4 ${paymentMethod === 'cash' ? 'opacity-100' : 'opacity-0'}`} />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="justify-start"
                  onClick={() => setPaymentMethod('card')}
                >
                  <Check className={`mr-2 h-4 w-4 ${paymentMethod === 'card' ? 'opacity-100' : 'opacity-0'}`} />
                  Card
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCheckoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout} 
              disabled={isPaymentProcessing}
            >
              {isPaymentProcessing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
            <DialogDescription>
              Transaction details
            </DialogDescription>
          </DialogHeader>
          
          {receiptData && (
            <div className="py-4" ref={receiptRef}>
              <div className="text-center space-y-1 mb-4">
                <h3 className="font-bold">Shop Receipt</h3>
                <p className="text-sm">Transaction ID: {receiptData.transaction_id}</p>
                <p className="text-sm">{formatDate(receiptData.created_at)}</p>
              </div>
              
              <div className="border-t border-b py-4 my-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left">Item</th>
                      <th className="py-2 text-right">Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items && receiptData.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-dashed last:border-b-0">
                        <td className="py-2">{item.name}</td>
                        <td className="py-2 text-right">{item.quantity}</td>
                        <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                        <td className="py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${receiptData.amount.toFixed(2)}</span>
              </div>
              
              <div className="mt-2 text-sm">
                <p>Payment Method: <span className="capitalize">{receiptData.payment_method}</span></p>
              </div>
              
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <p>Thank you for your purchase!</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReceiptDialogOpen(false)}
            >
              Close
            </Button>
            <Button 
              onClick={handleDownloadReceipt}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Billing;
