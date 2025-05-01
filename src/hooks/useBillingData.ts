
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product, BillItem, Transaction, TransactionResponse, ShopDetails } from "@/components/billing/types";
import { parseTransactionItems } from "@/components/utils/BillingUtils";

export const useBillingData = (profile: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [dailySaleCount, setDailySaleCount] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [shopDetails, setShopDetails] = useState<ShopDetails | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

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
          let unitType = 'piece' as const;
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
        const typedTransactions: Transaction[] = data.map((transaction: TransactionResponse) => ({
          id: transaction.id,
          transaction_id: transaction.transaction_id,
          created_at: transaction.created_at,
          amount: transaction.amount,
          items: parseTransactionItems(transaction.items),
          payment_method: transaction.payment_method,
          // Cast payment_details to the expected type, handling undefined case
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
