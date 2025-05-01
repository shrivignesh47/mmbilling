
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt, CreditCard, X } from "lucide-react";
import { BillItem } from "./types";
import { formatQuantityWithUnit } from "@/components/utils/UnitUtils";

interface CurrentBillProps {
  billItems: BillItem[];
  handleUpdateItemQuantity: (index: number, quantity: number) => void;
  handleRemoveItem: (index: number) => void;
  handleClearBill: () => void;
  setIsCheckoutDialogOpen: (open: boolean) => void;
}

const CurrentBill: React.FC<CurrentBillProps> = ({
  billItems,
  handleUpdateItemQuantity,
  handleRemoveItem,
  handleClearBill,
  setIsCheckoutDialogOpen
}) => {
  const getTotalAmount = () => {
    return billItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Current Bill</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleClearBill}
          disabled={billItems.length === 0}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {billItems.length > 0 ? (
          <div className="space-y-3">
            {billItems.map((item, index) => (
              <BillItemRow
                key={index}
                item={item}
                index={index}
                updateQuantity={handleUpdateItemQuantity}
                removeItem={handleRemoveItem}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No items added yet</p>
            <p className="text-xs mt-2">Scan products or click "Add to Bill"</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex items-center justify-between w-full border-t pt-4">
          <span className="font-semibold text-lg">Total:</span>
          <span className="font-bold text-lg">${getTotalAmount().toFixed(2)}</span>
        </div>
        <Button 
          className="w-full" 
          size="lg"
          disabled={billItems.length === 0}
          onClick={() => setIsCheckoutDialogOpen(true)}
        >
          <CreditCard className="mr-2 h-5 w-5" />
          Checkout
        </Button>
      </CardFooter>
    </Card>
  );
};

interface BillItemRowProps {
  item: BillItem;
  index: number;
  updateQuantity: (index: number, quantity: number) => void;
  removeItem: (index: number) => void;
}

const BillItemRow: React.FC<BillItemRowProps> = ({ item, index, updateQuantity, removeItem }) => {
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

export default CurrentBill;
