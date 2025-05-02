
import React from 'react';
import { Barcode, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { UnitType } from '@/components/utils/UnitUtils';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  barcode?: string;
  unitType: UnitType;
  sales_count: number;
}

interface ProductCardProps {
  product: Product;
  formatCurrency: (amount: number) => string;
  handleViewBarcode: (product: Product) => void;
  openEditProductForm: (product: Product) => void;
  handleDeleteProduct: (id: string, name: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  formatCurrency,
  handleViewBarcode,
  openEditProductForm,
  handleDeleteProduct
}) => {
  const getStockStatusBadge = (stock: number) => {
    if (stock <= 0) {
      return <AlertCircle className="text-destructive" />;
    } else if (stock <= 5) {
      return <Badge variant="outline" className="text-amber-500 border-amber-500">Low Stock</Badge>;
    } else {
      return <Badge variant="outline">In Stock</Badge>;
    }
  };

  return (
    <Card>
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
            <span className="font-medium">{formatCurrency(product.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Stock:</span>
            <span className="font-medium">{product.stock} units</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground text-sm">Barcode:</span>
            <div className="flex items-center">
              <span className="font-mono text-xs truncate mr-1 max-w-[100px]">{product.barcode}</span>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-5 w-5" 
                onClick={() => handleViewBarcode(product)}
              >
                <Barcode className="h-3 w-3" />
              </Button>
            </div>
          </div>
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
          Set as Inactive
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
