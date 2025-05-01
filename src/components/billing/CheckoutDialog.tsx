
import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, CreditCard, Wallet } from "lucide-react";
import { BillItem, PaymentDetails } from "./types";
import { calculateChange } from "@/components/utils/BillingUtils";

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billItems: BillItem[];
  totalAmount: number;
  onCompletePayment: (method: 'cash' | 'card' | 'upi', details: PaymentDetails) => void;
  isProcessing: boolean;
}

const CheckoutDialog: React.FC<CheckoutDialogProps> = ({
  isOpen,
  onClose,
  billItems,
  totalAmount,
  onCompletePayment,
  isProcessing
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [cashAmount, setCashAmount] = useState<string>(totalAmount.toFixed(2));
  const [cardReference, setCardReference] = useState<string>('');
  const [upiReference, setUpiReference] = useState<string>('');
  
  const handleCashPayment = () => {
    const amountPaid = parseFloat(cashAmount) || 0;
    if (amountPaid < totalAmount) {
      alert('Cash amount must be equal to or greater than the total amount');
      return;
    }
    
    const paymentDetails: PaymentDetails = {
      method: 'cash',
      amountPaid,
      changeAmount: calculateChange(totalAmount, amountPaid)
    };
    
    onCompletePayment('cash', paymentDetails);
  };
  
  const handleCardPayment = () => {
    if (!cardReference) {
      alert('Please enter the card transaction reference');
      return;
    }
    
    const paymentDetails: PaymentDetails = {
      method: 'card',
      reference: cardReference
    };
    
    onCompletePayment('card', paymentDetails);
  };
  
  const handleUpiPayment = () => {
    if (!upiReference) {
      alert('Please enter the UPI transaction reference');
      return;
    }
    
    const paymentDetails: PaymentDetails = {
      method: 'upi',
      reference: upiReference
    };
    
    onCompletePayment('upi', paymentDetails);
  };
  
  const handlePayment = () => {
    switch (paymentMethod) {
      case 'cash':
        handleCashPayment();
        break;
      case 'card':
        handleCardPayment();
        break;
      case 'upi':
        handleUpiPayment();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex justify-between font-medium">
            <span>Total Amount:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          
          <Tabs defaultValue="cash" onValueChange={(val) => setPaymentMethod(val as 'cash' | 'card' | 'upi')}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="card">Card</TabsTrigger>
              <TabsTrigger value="upi">UPI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cash" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cashAmount">Cash Amount</Label>
                <Input
                  id="cashAmount"
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  step="0.01"
                  min={totalAmount}
                />
              </div>
              
              {parseFloat(cashAmount) > totalAmount && (
                <div className="flex justify-between pt-2 border-t">
                  <span>Change:</span>
                  <span>${(parseFloat(cashAmount) - totalAmount).toFixed(2)}</span>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="card" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cardRef">Card Reference Number</Label>
                <Input
                  id="cardRef"
                  value={cardReference}
                  onChange={(e) => setCardReference(e.target.value)}
                  placeholder="Card transaction reference"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="upi" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upiRef">UPI Reference ID</Label>
                <Input
                  id="upiRef"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value)}
                  placeholder="UPI transaction ID"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-start">
          <Button onClick={onClose} variant="outline">Cancel</Button>
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="relative"
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
            {paymentMethod === 'cash' && <Wallet className="ml-2 h-4 w-4" />}
            {paymentMethod === 'card' && <CreditCard className="ml-2 h-4 w-4" />}
            {paymentMethod === 'upi' && <Check className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
