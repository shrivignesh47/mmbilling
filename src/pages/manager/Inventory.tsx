
import React, { useState } from "react";
import { 
  ArrowDownUp, 
  ArrowUpDown, 
  Download, 
  Filter, 
  PackageCheck, 
  PackageX, 
  Plus, 
  Search, 
  SlidersHorizontal 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatCard } from "@/components/dashboards/DashboardCards";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
}

const demoProducts: Product[] = [
  { id: "p1", name: "Wireless Headphones", category: "Electronics", price: 59.99, stock: 24, sku: "ELEC-001" },
  { id: "p2", name: "Smart Watch", category: "Electronics", price: 129.99, stock: 18, sku: "ELEC-002" },
  { id: "p3", name: "Bluetooth Speaker", category: "Electronics", price: 45.00, stock: 5, sku: "ELEC-003" },
  { id: "p4", name: "Phone Case", category: "Accessories", price: 19.99, stock: 50, sku: "ACC-001" },
  { id: "p5", name: "USB-C Cable", category: "Accessories", price: 12.99, stock: 36, sku: "ACC-002" },
  { id: "p6", name: "Power Bank", category: "Electronics", price: 35.00, stock: 12, sku: "ELEC-004" },
  { id: "p7", name: "Fitness Band", category: "Wearables", price: 49.99, stock: 0, sku: "WEAR-001" },
  { id: "p8", name: "Wireless Charger", category: "Electronics", price: 29.99, stock: 3, sku: "ELEC-005" },
  { id: "p9", name: "Tablet Stand", category: "Accessories", price: 15.99, stock: 22, sku: "ACC-003" },
  { id: "p10", name: "Laptop Sleeve", category: "Accessories", price: 24.99, stock: 14, sku: "ACC-004" },
];

const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Stock metrics
  const totalStock = demoProducts.reduce((sum, product) => sum + product.stock, 0);
  const lowStockCount = demoProducts.filter(product => product.stock > 0 && product.stock <= 5).length;
  const outOfStockCount = demoProducts.filter(product => product.stock === 0).length;
  
  // Filter and sort products
  let filteredProducts = [...demoProducts];
  
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  if (sortField) {
    filteredProducts.sort((a, b) => {
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
    if (stock <= 5) return { label: "Low Stock", variant: "warning" as const };
    return { label: "In Stock", variant: "success" as const };
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
            <Button onClick={() => {}}>
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
                  {filteredProducts.map((product) => {
                    const status = getStockStatus(product.stock);
                    let badgeVariant: "default" | "destructive" | "outline" | "secondary" | null = null;
                    
                    if (status.variant === "success") badgeVariant = "secondary";
                    if (status.variant === "warning") badgeVariant = "outline";
                    if (status.variant === "destructive") badgeVariant = "destructive";
                    
                    return (
                      <tr key={product.id} className="border-b">
                        <td className="py-3 px-4">{product.name}</td>
                        <td className="py-3 px-4">{product.category}</td>
                        <td className="py-3 px-4 text-right">${product.price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right">{product.stock}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={badgeVariant || "default"} className="whitespace-nowrap">
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">{product.sku}</td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
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
            <div>Showing {filteredProducts.length} of {demoProducts.length} products</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
