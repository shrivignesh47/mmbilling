
import React, { useState, useEffect, useRef } from "react";
import { Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import our components and utilities
import { 
  BillItem,
  Product,
  Transaction,
  TransactionResponse
} from "@/components/billing/types";
import ProductList from "@/components/billing/ProductList";
import CurrentBill from "@/components/billing/CurrentBill";
import TransactionHistory from "@/components/billing/TransactionHistory";
import BillingStats from "@/components/billing/BillingStats";
import CheckoutDialog from "@/components/billing/CheckoutDialog";
import ReceiptDialog from "@/components/billing/ReceiptDialog";
import { useBillingActions } from "@/hooks/useBillingActions";
import { useBillingData } from "@/hooks/useBillingData";

const Billing = () => {
  const { profile } = useAuth();
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<Transaction | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const { 
    products,
    filteredProducts,
    billItems,
    recentTransactions,
    dailySaleCount,
    dailyRevenue,
    shopDetails,
    searchTerm,
    selectedCategory,
    categories,
    setSearchTerm,
    setSelectedCategory,
    setBillItems
  } = useBillingData(profile);
  const {
    handleAddToBill,  // We'll use this one from useBillingActions
    handleUpdateItemQuantity,
    handleRemoveItem,
    handleClearBill,
    handleCheckout,
    handleBarcodeScanned,
    viewTransaction,
    handleDownloadReceipt,
    handleExportProducts
  } = useBillingActions({
    products,
    billItems,
    setBillItems,
    setIsCheckoutDialogOpen,
    setIsReceiptDialogOpen,
    setReceiptData,
    setIsPaymentProcessing,
    receiptRef,
    profile
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
          <p className="text-muted-foreground">
            Create and manage customer bills
          </p>
        </div>
        
        <BillingStats 
          dailySaleCount={dailySaleCount} 
          dailyRevenue={dailyRevenue} 
        />
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
        <ProductList
          products={products}
          filteredProducts={filteredProducts}
          categories={categories}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          isScanning={isScanning}
          setSearchTerm={setSearchTerm}
          setSelectedCategory={setSelectedCategory}
          setIsScanning={setIsScanning}
          handleAddToBill={handleAddToBill}
          handleBarcodeScanned={handleBarcodeScanned}
          handleExportProducts={handleExportProducts}
        />

        {/* Current Bill */}
        <CurrentBill
          billItems={billItems}
          handleUpdateItemQuantity={handleUpdateItemQuantity}
          handleRemoveItem={handleRemoveItem}
          handleClearBill={handleClearBill}
          setIsCheckoutDialogOpen={setIsCheckoutDialogOpen}
        />
      </div>

      {/* Transactions History Tab */}
      <TransactionHistory
        recentTransactions={recentTransactions}
        viewTransaction={viewTransaction}
      />

      {/* Import dialogs from components */}
      <CheckoutDialog
        isOpen={isCheckoutDialogOpen}
        onClose={() => setIsCheckoutDialogOpen(false)}
        billItems={billItems}
        totalAmount={billItems.reduce((total, item) => total + (item.price * item.quantity), 0)}
        onCompletePayment={handleCheckout}
        isProcessing={isPaymentProcessing}
      />

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
