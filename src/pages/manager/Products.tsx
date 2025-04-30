
import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  SlidersHorizontal,
  X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  sales_count: number;
  created_at: string;
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
  
  // Product form state
  const [productFormMode, setProductFormMode] = useState<'add' | 'edit'>('add');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    stock: 0,
    sku: '',
  });
  
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
      
      setProducts(data || []);
      setFilteredProducts(data || []);
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
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => 
        product.category.toLowerCase() === categoryFilter.toLowerCase()
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
    setFormData({
      name: '',
      category: '',
      price: 0,
      stock: 0,
      sku: '',
    });
    setIsProductFormOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setProductFormMode('edit');
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category || '',
      price: product.price,
      stock: product.stock,
      sku: product.sku || '',
    });
    setIsProductFormOpen(true);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.shop_id) {
      toast.error("No shop assigned");
      return;
    }
    
    try {
      if (productFormMode === 'add') {
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
    if (!confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      
      if (error) throw error;
      
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error("Error deleting product: " + error.message);
    }
  };

  const getStockStatusBadge = (stock: number) => {
    if (stock <= 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="warning" className="bg-amber-500">Low Stock</Badge>;
    } else {
      return <Badge variant="outline">In Stock</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your shop's products
          </p>
        </div>
        {profile?.shop_id && (
          <Button onClick={openAddProductForm}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {!profile?.shop_id && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Search and filters */}
      {profile?.shop_id && (
        <div className="flex gap-4 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <Button variant="outline" onClick={() => setIsFilterDialogOpen(true)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Filter Products</DialogTitle>
                <DialogDescription>
                  Refine the product list using filters
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={categoryFilter === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategoryFilter(null)}
                    >
                      All
                    </Button>
                    {getUniqueCategories().map((category) => (
                      <Button
                        key={category}
                        variant={categoryFilter === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategoryFilter(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Stock Status</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={stockFilter === 'all' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStockFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={stockFilter === 'in-stock' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStockFilter('in-stock')}
                    >
                      In Stock
                    </Button>
                    <Button
                      variant={stockFilter === 'low-stock' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStockFilter('low-stock')}
                    >
                      Low Stock
                    </Button>
                    <Button
                      variant={stockFilter === 'out-of-stock' ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStockFilter('out-of-stock')}
                    >
                      Out of Stock
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
                <Button onClick={() => setIsFilterDialogOpen(false)}>Apply</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Products List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
              <CardFooter>
                <div className="h-9 bg-muted rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No products found</p>
                <p className="text-sm text-muted-foreground mb-6">
                  {products.length > 0
                    ? "Try adjusting your search or filters"
                    : "Start by adding some products to your inventory"}
                </p>
                {products.length === 0 && (
                  <Button onClick={openAddProductForm}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Product
                  </Button>
                )}
                {products.length > 0 && (
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{product.name}</CardTitle>
                        <CardDescription>{product.category || "Uncategorized"}</CardDescription>
                      </div>
                      {getStockStatusBadge(product.stock)}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Price:</span>
                        <span className="font-medium">${product.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Stock:</span>
                        <span className="font-medium">{product.stock} units</span>
                      </div>
                      {product.sku && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">SKU:</span>
                          <span className="font-medium">{product.sku}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">Sales:</span>
                        <span className="font-medium">{product.sales_count || 0} units</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button
                      variant="outline" 
                      className="flex-1"
                      onClick={() => openEditProductForm(product)}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="outline" 
                      className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Product Form Dialog */}
      <Dialog open={isProductFormOpen} onOpenChange={setIsProductFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {productFormMode === 'add' ? 'Add New Product' : 'Edit Product'}
            </DialogTitle>
            <DialogDescription>
              {productFormMode === 'add' 
                ? 'Add a new product to your inventory' 
                : 'Update product information'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProductFormSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter product name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  placeholder="Enter product category"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="Enter product SKU"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {productFormMode === 'add' ? 'Add Product' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
