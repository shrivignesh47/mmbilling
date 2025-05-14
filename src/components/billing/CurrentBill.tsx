
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt, CreditCard } from "lucide-react";
import { BillItem } from "./types";
import BillItemRow from "./BillItemRow";

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
          <span className="font-bold text-lg">₹{getTotalAmount().toFixed(2)}</span>
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

export default CurrentBill;
