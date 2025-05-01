
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { BillItem } from "./types";
import { formatQuantityWithUnit } from "@/components/utils/UnitUtils";

interface BillItemRowProps {
  item: BillItem;
  index: number;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
}

const BillItemRow: React.FC<BillItemRowProps> = ({ 
  item, 
  index, 
  updateQuantity, 
  removeItem 
}) => {
  return (
    <div className="flex items-center justify-between pb-2 border-b">
      <div className="flex-1">
        <p className="text-sm font-medium">{item.name}</p>
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>${item.price.toFixed(2)} each</span>
          <span className="font-mono">
            {item.unitType ? formatQuantityWithUnit(item.quantity, item.unitType) : item.quantity}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2 ml-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6" 
          onClick={() => {
            const decrement = item.unitType === 'kg' || item.unitType === 'liter' ? 0.1 : 1;
            updateQuantity(index, Math.max(0, item.quantity - decrement));
          }}
        >
          -
        </Button>
        <span className="w-10 text-center">
          {item.unitType === 'kg' || item.unitType === 'liter' 
            ? item.quantity.toFixed(1) 
            : item.quantity}
        </span>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6"
          onClick={() => {
            const increment = item.unitType === 'kg' || item.unitType === 'liter' ? 0.1 : 1;
            updateQuantity(index, item.quantity + increment);
          }}
        >
          +
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-destructive"
          onClick={() => removeItem(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BillItemRow;
