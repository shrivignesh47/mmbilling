
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, CreditCard, QrCode } from 'lucide-react';
import { Tabs, TabsList, TabsContent, TabsTrigger } from '@/components/ui/tabs';
import { calculateChange, type BillItem } from '@/components/utils/BillingUtils';
import { toast } from 'sonner';

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  billItems: BillItem[];
  totalAmount: number;
  onCompletePayment: (paymentMethod: 'cash' | 'card' | 'upi', paymentDetails: any) => Promise<void>;
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
  const [amountPaid, setAmountPaid] = useState<string>(totalAmount.toFixed(2));
  const [changeAmount, setChangeAmount] = useState<number>(0);
  const [cardNumber, setCardNumber] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmountPaid(value);
    
    const numericValue = parseFloat(value) || 0;
    const change = calculateChange(totalAmount, numericValue);
    setChangeAmount(change);
  };

  const handleCompletePayment = async () => {
    // Validate based on payment method
    if (paymentMethod === 'cash') {
      const numericValue = parseFloat(amountPaid) || 0;
      if (numericValue < totalAmount) {
        toast.error('Amount paid must be at least the total amount');
        return;
      }
    } else if (paymentMethod === 'card') {
      if (cardNumber.length < 4) {
        toast.error('Please enter last 4 digits of the card');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        toast.error('Please enter a valid UPI ID');
        return;
      }
    }

    // Prepare payment details
    const paymentDetails = {
      method: paymentMethod,
      amountPaid: parseFloat(amountPaid) || totalAmount,
      changeAmount: changeAmount,
      reference: paymentMethod === 'card' ? cardNumber : paymentMethod === 'upi' ? upiId : undefined
    };

    // Complete payment
    await onCompletePayment(paymentMethod, paymentDetails);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Select a payment method to finalize the bill.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex justify-between text-lg">
            <span>Total Amount:</span>
            <span className="font-bold">${totalAmount.toFixed(2)}</span>
          </div>
          
          <Tabs defaultValue="cash" onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card' | 'upi')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cash">Cash</TabsTrigger>
              <TabsTrigger value="card">Card</TabsTrigger>
              <TabsTrigger value="upi">UPI</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cash" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount-paid">Amount Received</Label>
                <Input 
                  id="amount-paid"
                  type="number" 
                  step="0.01"
                  value={amountPaid}
                  onChange={handleAmountPaidChange}
                />
              </div>
              
              <div className="flex justify-between p-3 border rounded-md bg-muted/30">
                <span>Change to Return:</span>
                <span className="font-bold">${changeAmount.toFixed(2)}</span>
              </div>
            </TabsContent>
            
            <TabsContent value="card" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="card-number">Last 4 Digits</Label>
                <Input 
                  id="card-number"
                  maxLength={4}
                  placeholder="1234"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2" />
                Process the card payment using your POS terminal
              </div>
            </TabsContent>
            
            <TabsContent value="upi" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="upi-id">UPI ID</Label>
                <Input 
                  id="upi-id"
                  placeholder="name@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <QrCode className="h-8 w-8 mx-auto mb-2" />
                Have customer scan your payment QR code or enter their UPI ID
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCompletePayment} 
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
