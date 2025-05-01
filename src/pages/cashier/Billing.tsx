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
  X,
  Barcode,
  FileText,
  QrCode
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Import our new utilities and components
import { 
  addToBill, 
  updateItemQuantity as updateItemQty, 
  removeItem as removeCartItem, 
  clearBill as clearCart,
  getTotalAmount,
  downloadReceipt as downloadReceiptFile,
  billItemsToJson,
  parseTransactionItems,
  formatPaymentMethod,
  formatQuantityWithUnit,
  type BillItem,
  type Product,
  type UnitType,
  type PaymentDetails
} from "@/components/utils/BillingUtils";
import { exportToExcel, formatProductsForExport } from "@/components/utils/ExportUtils";
import { generateProductBarcode } from "@/components/utils/BarcodeUtils";
import BarcodeScanner from "@/components/products/BarcodeScanner";
import CheckoutDialog from "@/components/billing/CheckoutDialog";
import ReceiptDialog from "@/components/billing/ReceiptDialog";
import UnitQuantityInput from "@/components/products/UnitQuantityInput";

// Define more detailed transaction interface
interface Transaction {
  id: string;
  transaction_id: string;
  created_at: string;
  amount: number;
  items: BillItem[];
  payment_method: string;
  payment_details?: {
    amountPaid?: number;
    changeAmount?: number;
    reference?: string;
  };
}

const Billing = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [receiptData, setReceiptData] = useState<Transaction | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [dailySaleCount, setDailySaleCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [shopDetails, setShopDetails] = useState<{name: string, address: string} | null>(null);

  // Fetch initial data when component mounts
  useEffect(() => {
    if (profile?.shop_id) {
      fetchProducts();
      fetchRecentTransactions();
      fetchDailySaleCount();
      fetchDailyRevenue();
      fetchShopDetails();
    }
  }, [profile?.shop_id]);

  // Update filtered products when search term or category changes
  useEffect(() => {
    let filtered = products;
    
    // Apply category filter if selected
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  // Extract categories from products
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories as string[]);
    }
  }, [products]);

  const fetchShopDetails = async () => {
    try {
      if (!profile?.shop_id) return;
      
      const { data, error } = await supabase
        .from('shops')
        .select('name, address')
        .eq('id', profile.shop_id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setShopDetails({
          name: data.name,
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching shop details:', error);
    }
  };

  const fetchProducts = async () => {
    if (!profile?.shop_id) return;

    try {
      const { data, error } = await supabase
        .from("products")
        .select('*')
        .eq('shop_id', profile.shop_id)
        .order('name');
      
      if (error) throw error;
      
      if (data) {
        const typedProducts: Product[] = data.map(product => {
          // Generate barcode for each product if not already present
          const barcode = product.sku || `PROD-${product.id.slice(-8).toUpperCase()}`;
          
          // Determine unit type based on category
          let unitType: UnitType = 'piece';
          if (product.category) {
            const category = product.category.toLowerCase();
            if (category.includes('vegetable') || category.includes('fruit') || category.includes('produce')) {
              unitType = 'kg';
            } else if (category.includes('milk') || category.includes('juice') || category.includes('liquid') || category.includes('beverage')) {
              unitType = 'liter';
            } else if (category.includes('pack') || category.includes('bundle')) {
              unitType = 'pack';
            }
          }
          
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category || '',
            sku: product.sku || '',
            barcode,
            unitType
          };
        });
        
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
          payment_method: transaction.payment_method,
          payment_details: transaction.payment_details as any
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
        .select('*', { count: 'exact', head: false })
        .eq('shop_id', profile.shop_id)
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
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

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'upi', paymentDetails: any) => {
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
        payment_method: paymentMethod,
        payment_details: paymentDetails
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
        const transaction: Transaction = {
          id: transactionResult.id,
          transaction_id: transactionResult.transaction_id,
          created_at: transactionResult.created_at,
          amount: transactionResult.amount,
          items: parseTransactionItems(transactionResult.items),
          payment_method: transactionResult.payment_method,
          payment_details: transactionResult.payment_details
        };
        
        setReceiptData(transaction);
        setIsReceiptDialogOpen(true);
      }
      
      // Reset the bill
      setBillItems([]);
      setIsCheckoutDialogOpen(false);
      
      // Refresh product list and transactions
      fetchProducts();
      fetchRecentTransactions();
      fetchDailySaleCount();
      fetchDailyRevenue();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (receiptRef.current && receiptData) {
      downloadReceiptFile(receiptRef, receiptData);
    }
  };

  const viewTransaction = async (transaction: Transaction) => {
    setReceiptData(transaction);
    setIsReceiptDialogOpen(true);
  };

  const handleExportProducts = () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    
    const formattedData = formatProductsForExport(products);
    exportToExcel(formattedData, 'products-inventory');
    toast.success('Products exported to Excel');
  };

  const handleBarcodeScanned = (barcode: string) => {
    // Search for product by barcode
    const product = products.find(p => 
      p.barcode === barcode || p.sku === barcode || `PROD-${p.id.slice(-8).toUpperCase()}` === barcode
    );
    
    if (product) {
      handleAddToBill(product);
      toast.success(`Added ${product.name} to bill`);
    } else {
      toast.error('Product not found');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">
            Create and manage customer bills
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Today's Sales</div>
            <div className="text-xl font-bold">{dailySaleCount} orders</div>
          </div>
          <div className="text-right ml-6">
            <div className="text-sm text-muted-foreground">Today's Revenue</div>
            <div className="text-xl font-bold text-green-600">${dailyRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {!profile?.shop_id && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the manager to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Section: Product Selection and Scanner */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle>Products</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportProducts}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant={isScanning ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setIsScanning(!isScanning)}
                >
                  <QrCode className="h-4 w-4 mr-1" />
                  {isScanning ? 'Stop Scanning' : 'Scan Products'}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {isScanning && (
                <BarcodeScanner 
                  onScan={handleBarcodeScanned}
                  isScanning={isScanning}
                  setIsScanning={setIsScanning}
                />
              )}
              
              {/* Category filter pills */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-h-[400px] overflow-y-auto p-6">
            {filteredProducts.map(product => (
              <Card key={product.id} className="overflow-hidden">
                <div className="p-4">
                  <h3 className="text-sm font-medium">{product.name}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {product.category || 'Uncategorized'}
                    </span>
                    <span className="text-xs bg-muted px-2 py-1 rounded-full">
                      {product.unitType || 'piece'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">
                      Stock: {product.stock} {product.unitType === 'kg' || product.unitType === 'liter' ? product.unitType : ''}
                    </span>
                  </div>
                  {product.barcode && (
                    <div className="mt-1 text-xs flex items-center text-muted-foreground">
                      <Barcode className="h-3 w-3 mr-1" />
                      <span className="font-mono truncate">{product.barcode}</span>
                    </div>
                  )}
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
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>${item.price.toFixed(2)} each</span>
                        <span className="font-mono">
                          {item.unitType ? formatQuantityWithUnit(item.quantity, item.unitType) : item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => {
                          const decrement = item.unitType === 'kg' || item.unitType === 'liter' ? 0.1 : 1;
                          handleUpdateItemQuantity(index, Math.max(0, item.quantity - decrement));
                        }}
                      >
                        -
                      </Button>
                      <span className="w-10 text-center">
                        {item.unitType === 'kg' || item.unitType === 'liter' 
                          ? item.quantity.toFixed(1) 
                          : item.quantity}
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => {
                          const increment = item.unitType === 'kg' || item.unitType === 'liter' ? 0.1 : 1;
                          handleUpdateItemQuantity(index, item.quantity + increment);
                        }}
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
                <p className="text-xs mt-2">Scan products or click "Add to Bill"</p>
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
      <CheckoutDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => setIsCheckoutDialogOpen(false)}
        billItems={billItems}
        totalAmount={getTotalAmount(billItems)}
        onCompletePayment={handleCheckout}
        isProcessing={isPaymentProcessing}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        receiptData={receiptData}
        shopName={shopDetails?.name}
        shopAddress={shopDetails?.address}
        cashierName={profile?.name || ''}
        onDownload={handleDownloadReceipt}
      />
    </div>
  );
};

export default Billing;
