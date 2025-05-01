
import { useState, useEffect } from "react";
import { Product, BillItem, Transaction, ShopDetails } from "@/components/billing/types";
import { useProductsData } from "@/hooks/billing/useProductsData";
import { useTransactionsData } from "@/hooks/billing/useTransactionsData";
import { useSalesData } from "@/hooks/billing/useSalesData";
import { useShopDetails } from "@/hooks/billing/useShopDetails";

export const useBillingData = (profile: any) => {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  
  // Use the smaller hook modules
  const { 
    products, 
    filteredProducts,
    categories,
    fetchProducts 
  } = useProductsData(profile, searchTerm, selectedCategory);
  
  const { 
    recentTransactions, 
    fetchRecentTransactions
  } = useTransactionsData(profile);
  
  const { 
    dailySaleCount, 
    dailyRevenue,
    fetchDailySaleCount,
    fetchDailyRevenue
  } = useSalesData(profile);
  
  const { shopDetails } = useShopDetails(profile);

  return {
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
    isPaymentProcessing,
    setSearchTerm,
    setSelectedCategory,
    setBillItems,
    setIsPaymentProcessing,
    fetchProducts,
    fetchRecentTransactions,
    fetchDailySaleCount,
    fetchDailyRevenue
  };
};
