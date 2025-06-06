import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exportBarcodesToExcel, generateBarcode } from "@/components/utils/BarcodeGeneratorUtils";
import { UnitType } from "@/components/utils/UnitUtils";

// Import our refactored components
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsFilter from "@/components/products/ProductsFilter";
import ProductsGrid from "@/components/products/ProductsGrid";
import ProductForm, { ProductFormData } from "@/components/products/ProductForm";
import BarcodeGenerator from "@/components/products/BarcodeGenerator";

// Define the proper Product interface with barcode and unitType as UnitType
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string | null;
  barcode: string;
  unitType: UnitType;
  sales_count: number;
  created_at?: string;
  shop_id?: string;
  updated_at?: string;
  gstPercentage: number;
  sgst: number;
  cgst: number;
  mrp: number; // Add MRP field
  StockPrice : number; // Add Selling Price field
  w_rate: number; // Add Weight Rate field
  TotalAmount: number; // Add Amount field
}

// Define the database product type to match what comes from Supabase
interface DatabaseProduct {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  sku: string | null;
  barcode?: string | null;
  unitType?: string | null;
  sales_count: number | null;
  created_at: string | null;
  shop_id: string;
  updated_at: string | null;
  gstPercentage: number;
  sgst: number;
  cgst: number;
  mrp: number; // Add MRP field
  StockPrice : number; // Add Selling Price field
  w_rate: number; // Add Weight Rate field
  TotalAmount: number; // Add Amount field
}

const Products = () => {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isBarcodeDialogOpen, setIsBarcodeDialogOpen] = useState(false);
  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);
  
  // Product form state
  const [productFormMode, setProductFormMode] = useState<'add' | 'edit'>('add');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  useEffect(() => {
    if (profile?.shop_id) {
      fetchProducts();
    }
  }, [profile?.shop_id]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, stockFilter]);

  const fetchProducts = async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", profile.shop_id);
      
      if (error) throw error;
      
      // Add barcode and convert unitType to proper UnitType
      const productsWithBarcodes = (data || []).map((product: DatabaseProduct) => {
        // Generate barcode if not present
        const barcode = product.barcode || product.sku || `PROD-${product.id.slice(-8).toUpperCase()}`;
        
        // Determine unit type - ensure it's a valid UnitType
        let unitType: UnitType = 'piece';
        if (product.unitType) {
          const validUnitTypes: UnitType[] = ['kg', 'liter', 'piece', 'pack', 'ml', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
          if (validUnitTypes.includes(product.unitType as UnitType)) {
            unitType = product.unitType as UnitType;
          }
        }
        
        return {
          ...product,
          barcode,
          unitType,
          sku: product.sku || '',
          category: product.category || '',
          sales_count: product.sales_count || 0
        };
      });
      
      // Cast to Product[] since we've ensured all required properties are set
      setProducts(productsWithBarcodes as Product[]);
      setFilteredProducts(productsWithBarcodes as Product[]);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error("Error loading products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase() === categoryFilter.toLowerCase()
      );
    }
    
    // Apply stock filter
    if (stockFilter !== 'all') {
      if (stockFilter === 'in-stock') {
        filtered = filtered.filter(product => product.stock > 5);
      } else if (stockFilter === 'low-stock') {
        filtered = filtered.filter(product => product.stock > 0 && product.stock <= 5);
      } else if (stockFilter === 'out-of-stock') {
        filtered = filtered.filter(product => product.stock === 0);
      }
    }
    
    setFilteredProducts(filtered);
  };

  const resetFilters = () => {
    setCategoryFilter(null);
    setStockFilter('all');
    setSearchTerm('');
  };

  const getUniqueCategories = () => {
    const categories = products
      .map(product => product.category)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    return categories;
  };

  const openAddProductForm = () => {
    setProductFormMode('add');
    setSelectedProduct(null);
    setIsProductFormOpen(true);
  };

  const openEditProductForm = async (product: Product) => {
    setProductFormMode('edit');
    setIsProductFormOpen(false); // Close if already open, to reset state
  
    // Fetch latest product data from API
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", product.id)
        .single();
  
      if (error) throw error;
  
      // Prepare the product object as per your Product interface
      const latestProduct: Product = {
        ...data,
        barcode: data.barcode || data.sku || `PROD-${data.id.slice(-8).toUpperCase()}`,
        unitType: data.unitType || 'piece',
        sku: data.sku || '',
        category: data.category || '',
        sales_count: data.sales_count || 0,
      };
  
      setSelectedProduct(latestProduct);
      setIsProductFormOpen(true);
    } catch (error: any) {
      toast.error("Failed to load product for editing: " + error.message);
    }
  };

  const handleViewBarcode = (product: Product) => {
    setSelectedProductForBarcode(product);
    setIsBarcodeDialogOpen(true);
  };

  const handleExportAllBarcodes = () => {
    if (products.length === 0) {
      toast.error("No products to export barcodes");
      return;
    }
    
    exportBarcodesToExcel(products);
    toast.success("Barcodes exported to Excel");
  };

  const handleProductFormSubmit = async (formData: ProductFormData) => {
    if (!profile?.shop_id) {
      toast.error("No shop assigned");
      return;
    }
    
    try {
      if (productFormMode === 'add') {
        // Generate barcode for new product
        const barcode = formData.sku || `PROD-${Date.now().toString().slice(-8)}`;
        
        // Add product
        const { data, error } = await supabase
          .from("products")
          .insert({
            shop_id: profile.shop_id,
            name: formData.name,
            category: formData.category,
            price: formData.price,
            stock: formData.stock,
            sku: formData.sku,
            barcode: barcode,
            unitType: formData.unitType,
            sgst:formData.sgst,
            cgst:formData.cgst,
            mrp:formData.mrp,
            StockPrice:formData.StockPrice,
            w_rate:formData.w_rate,
            TotalAmount:formData.TotalAmount,
          })
          .select();
        
        if (error) throw error;
        
        // Add inventory log
        await supabase
          .from("inventory_logs")
          .insert({
            shop_id: profile.shop_id,
            product_id: data[0].id,
            product_name: formData.name,
            action: 'initial',
            quantity: formData.stock,
          });
        
        toast.success("Product added successfully");
      } else {
        // Edit product
        if (!selectedProduct) return;
        
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            category: formData.category,
            price: formData.price,
            stock: formData.stock,
            sku: formData.sku,
            unitType: formData.unitType, 
            sgst:formData.sgst,
            cgst:formData.cgst,
            mrp:formData.mrp,
            StockPrice:formData.StockPrice,
            w_rate:formData.w_rate,
            TotalAmount:formData.TotalAmount
          })
          .eq("id", selectedProduct.id);
        
        if (error) throw error;
        
        // Add inventory log if stock changed
        if (formData.stock !== selectedProduct.stock) {
          const diff = formData.stock - selectedProduct.stock;
          if (diff !== 0) {
            await supabase
              .from("inventory_logs")
              .insert({
                shop_id: profile.shop_id,
                product_id: selectedProduct.id,
                product_name: formData.name,
                action: diff > 0 ? 'restock' : 'adjustment',
                quantity: Math.abs(diff),
              });
          }
        }
        
        toast.success("Product updated successfully");
      }
      
      // Reset and close the form
      setIsProductFormOpen(false);
      fetchProducts();
      
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error("Error saving product: " + error.message);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    toast.error("Products cannot be deleted due to database constraints. Please set stock to 0 instead.", {
      duration: 5000,
    });
  };

  // Format currency to Rupees
  const formatCurrency = (amount: number | null) => {
      if (amount === null || amount === undefined) {
          return 'Not updated';
      }
      return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header with title and action buttons */}
      <ProductsHeader 
        shopId={profile?.shop_id}
        openAddProductForm={openAddProductForm}
        handleExportAllBarcodes={handleExportAllBarcodes}
      />
      
      {/* Search and filters */}
      {profile?.shop_id && (
        <ProductsFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          isFilterDialogOpen={isFilterDialogOpen}
          setIsFilterDialogOpen={setIsFilterDialogOpen}
          resetFilters={resetFilters}
          categories={getUniqueCategories()}
        />
      )}
      
      {/* Products List */}
      <ProductsGrid
        loading={loading}
        filteredProducts={filteredProducts}
        products={products}
        formatCurrency={formatCurrency}
        handleViewBarcode={handleViewBarcode}
        openEditProductForm={openEditProductForm} // Pass the updated function
        handleDeleteProduct={handleDeleteProduct}
        openAddProductForm={openAddProductForm}
        resetFilters={resetFilters}
      />
      
      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent className="max-w-xs w-full p-1">
          <ProductForm
            key={selectedProduct ? selectedProduct.id : 'add'}
            isOpen={isProductFormOpen}
            onClose={() => setIsProductFormOpen(false)}
            onSubmit={handleProductFormSubmit}
            productMode={productFormMode}
            initialData={selectedProduct ? {
              id: selectedProduct.id,
              name: selectedProduct.name,
              category: selectedProduct.category || '',
              price: selectedProduct.price,
              stock: selectedProduct.stock,
              sku: selectedProduct.sku || '',
              barcode: selectedProduct.barcode,
              unitType: selectedProduct.unitType,
              sgst: selectedProduct.sgst,
              cgst: selectedProduct.cgst,
              mrp: selectedProduct.mrp,
              StockPrice: selectedProduct.StockPrice,
              w_rate: selectedProduct.w_rate,
              TotalAmount: selectedProduct.TotalAmount,
              gstPercentage: selectedProduct.gstPercentage,
            } : undefined}
            exportBarcodes={handleExportAllBarcodes}
          />
        </DialogContent>
      </Dialog>
      {/* Barcode Dialog */}
      <Dialog open={isBarcodeDialogOpen} onOpenChange={setIsBarcodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Barcode</DialogTitle>
            <DialogDescription>
              View and download barcode for {selectedProductForBarcode?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProductForBarcode && (
            <div className="py-4">
              <BarcodeGenerator 
                product={selectedProductForBarcode} 
                onExportBarcodes={handleExportAllBarcodes}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
