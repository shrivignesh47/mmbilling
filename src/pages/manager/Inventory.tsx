import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  X,
  AlertCircle,
  Check,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
}

const Inventory: React.FC = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchProducts();
    }
  }, [profile?.shop_id]);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, sortField, sortDirection]);

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

  const filterAndSortProducts = () => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        
        return 0;
      });
    }
    
    setFilteredProducts(filtered);
  };
  
  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const };
    if (stock <= 5) return { label: "Low Stock", variant: "outline" as const };
    return { label: "In Stock", variant: "secondary" as const };
  };

  // Stock metrics
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStockCount = products.filter(product => product.stock > 0 && product.stock <= 5).length;
  const outOfStockCount = products.filter(product => product.stock === 0).length;

  // Format currency to Rupees
  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground">
          Manage your products and stock levels
        </p>
      </div>

      {/* Inventory Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Stock"
          value={totalStock.toString()}
          icon={<PackageCheck className="h-4 w-4 text-muted-foreground" />}
          description="Across all products"
        />
        <StatCard
          title="Low Stock Items"
          value={lowStockCount.toString()}
          icon={<PackageX className="h-4 w-4 text-muted-foreground" />}
          description="Need reordering soon"
          className="border-amber-200 dark:border-amber-800"
        />
        <StatCard
          title="Out of Stock"
          value={outOfStockCount.toString()}
          icon={<PackageX className="h-4 w-4 text-muted-foreground" />}
          description="Unavailable products"
          className="border-destructive/50"
        />
      </div>

      {/* Inventory Table Card */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your inventory and stock levels
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="hidden md:flex" onClick={() => {}}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" className="hidden md:flex" onClick={() => {}}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={() => navigate('/manager/products')}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="mb-6 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="md:hidden">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Products Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-3 px-4 text-left font-medium">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium flex items-center"
                        onClick={() => handleSort("name")}
                      >
                        Product
                        {sortField === "name" ? (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowDownUp className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </th>
                    <th className="py-3 px-4 text-left font-medium">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium flex items-center"
                        onClick={() => handleSort("category")}
                      >
                        Category
                        {sortField === "category" ? (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowDownUp className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </th>
                    <th className="py-3 px-4 text-right font-medium">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium flex items-center ml-auto"
                        onClick={() => handleSort("price")}
                      >
                        Price
                        {sortField === "price" ? (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowDownUp className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </th>
                    <th className="py-3 px-4 text-right font-medium">
                      <Button
                        variant="ghost"
                        className="p-0 font-medium flex items-center ml-auto"
                        onClick={() => handleSort("stock")}
                      >
                        Stock
                        {sortField === "stock" ? (
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        ) : (
                          <ArrowDownUp className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </th>
                    <th className="py-3 px-4 text-center font-medium">Status</th>
                    <th className="py-3 px-4 text-right font-medium">SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array(5).fill(0).map((_, index) => (
                      <tr key={index} className="border-b animate-pulse">
                        <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                        <td className="py-3 px-4"><div className="h-4 bg-muted rounded w-20"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
                        <td className="py-3 px-4 text-center"><div className="h-4 bg-muted rounded w-16 mx-auto"></div></td>
                        <td className="py-3 px-4 text-right"><div className="h-4 bg-muted rounded w-12 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : (
                    filteredProducts.map((product) => {
                      const status = getStockStatus(product.stock);
                      
                      return (
                        <tr key={product.id} className="border-b">
                          <td className="py-3 px-4">{product.name}</td>
                          <td className="py-3 px-4">{product.category || "Uncategorized"}</td>
                          <td className="py-3 px-4 text-right">{formatCurrency(product.price)}</td>
                          <td className="py-3 px-4 text-right">{product.stock}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={status.variant} className="whitespace-nowrap">
                              {status.label}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">{product.sku || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                  {!loading && filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-muted-foreground">
                        No products found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <div>Showing {filteredProducts.length} of {products.length} products</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
