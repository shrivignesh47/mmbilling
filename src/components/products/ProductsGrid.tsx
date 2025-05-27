
import React from 'react';
import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductCard from './ProductCard';
import { UnitType } from '@/components/utils/UnitUtils';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  barcode?: string;
  sales_count: number;
  unitType: UnitType;
  gstPercentage: number;
  mrp: number; // Add MRP field
  StockPrice : number; // Add Selling Price field
  w_rate: number; // Add this property to fix the error
}

interface ProductsGridProps {
  loading: boolean;
  filteredProducts: Product[];
  products: Product[];
  formatCurrency: (amount: number) => string;
  handleViewBarcode: (product: Product) => void;
  openEditProductForm: (product: Product) => void;
  handleDeleteProduct: (id: string, name: string) => void;
  openAddProductForm: () => void;
  resetFilters: () => void;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({
  loading,
  filteredProducts,
  products,
  formatCurrency,
  handleViewBarcode,
  openEditProductForm,
  handleDeleteProduct,
  openAddProductForm,
  resetFilters
}) => {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-5 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-6"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
                <div className="h-4 bg-muted rounded w-full mb-1"></div>
              </div>
              <div className="h-9 bg-muted rounded w-full mt-4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
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
              <Package className="mr-2 h-4 w-4" />
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
    );
  }

  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          formatCurrency={formatCurrency}
          handleViewBarcode={handleViewBarcode}
          openEditProductForm={openEditProductForm}
          handleDeleteProduct={handleDeleteProduct}
        />
      ))}
    </div>
  );
};

export default ProductsGrid;
