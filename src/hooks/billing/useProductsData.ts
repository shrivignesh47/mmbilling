
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Product } from "@/components/billing/types";
import { UnitType, getCategoryUnitType } from "@/components/utils/UnitUtils";

export const useProductsData = (
  profile: any, 
  searchTerm: string,
  selectedCategory: string | null
) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch products on mount or when profile changes
  useEffect(() => {
    if (profile?.shop_id) {
      fetchProducts();
    }
  }, [profile?.shop_id]);

  // Update filtered products when products, search term or category changes
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
          
          // Determine unit type based on stored value or category
          // Handle the case where unitType might not exist in the database
          let unitType: UnitType = 'piece';
          if (typeof product.unitType === 'string' && product.unitType) {
            // Check if the unitType from database is valid
            const validUnitTypes: UnitType[] = ['kg', 'liter', 'piece', 'pack', 'ml', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
            if (validUnitTypes.includes(product.unitType as UnitType)) {
              unitType = product.unitType as UnitType;
            }
          } else {
            // Use category to determine unit type
            unitType = getCategoryUnitType(product.category);
          }
          
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category || '',
            sku: product.sku || '',
            barcode,
            unitType,
            sales_count: product.sales_count || 0
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

  return {
    products,
    filteredProducts,
    categories,
    fetchProducts
  };
};
