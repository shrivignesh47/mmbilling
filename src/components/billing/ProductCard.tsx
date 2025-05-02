
import React from "react";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Barcode } from "lucide-react";
import { Product } from "./types";
import { generateBarcode } from "../utils/BarcodeGeneratorUtils";
import { UnitType } from "@/components/utils/UnitUtils";

interface ProductCardProps {
  product: Product;
  onAddToBill: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToBill }) => {
  // Ensure product has a barcode, either from the product or generate one
  const barcode = product.barcode || generateBarcode(product);
  
  return (
    <Card key={product.id} className="overflow-hidden">
      <div className="p-4">
        <h3 className="text-sm font-medium">{product.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            {product.category || 'Uncategorized'}
          </span>
          <span className="text-xs bg-muted px-2 py-1 rounded-full">
            {product.unitType || 'piece'}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="font-bold">${product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">
            Stock: {product.stock} {product.unitType === 'kg' || product.unitType === 'liter' ? product.unitType : ''}
          </span>
        </div>
        <div className="mt-1 text-xs flex items-center text-muted-foreground">
          <Barcode className="h-3 w-3 mr-1" />
          <span className="font-mono truncate">{barcode}</span>
        </div>
      </div>
      <CardFooter className="border-t bg-muted/50 p-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onAddToBill(product)}
          className="w-full"
          disabled={product.stock <= 0}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add to Bill
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
