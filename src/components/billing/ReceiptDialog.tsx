import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Download, Printer, Share } from 'lucide-react';
import { formatPaymentMethod, type BillItem } from '@/components/utils/BillingUtils';
import { formatQuantityWithUnit } from '@/components/utils/UnitUtils';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    id: string;
    transaction_id: string;
    created_at: string;
    amount: number;
    items: BillItem[];
    payment_method: string;
    paymentDetails?: {
      amountPaid?: number;
      changeAmount?: number;
      reference?: string;
    };
  } | null;
  shopName?: string;
  shopAddress?: string;
  cashierName?: string;
  onDownload: () => void;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  isOpen,
  onClose,
  receiptData,
  shopName = 'My Shop',
  shopAddress = '',
  cashierName = '',
  onDownload
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handlePrint = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt #${receiptData?.transaction_id}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-items { border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc; margin: 15px 0; padding: 15px 0; }
                .item-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                .total-row { font-weight: bold; margin-top: 10px; }
                .payment-info { margin-top: 20px; }
                .shop-info { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Transaction details
          </DialogDescription>
        </DialogHeader>
        
        {receiptData && (
          <div className="py-4" ref={receiptRef}>
            <div className="receipt-header text-center space-y-1 mb-4">
              <h3 className="font-bold text-xl">{shopName}</h3>
              {shopAddress && <p className="text-sm">{shopAddress}</p>}
              <p className="text-sm font-mono">Receipt #{receiptData.transaction_id}</p>
              <p className="text-sm">{formatDate(receiptData.created_at)}</p>
              {cashierName && <p className="text-sm">Served by: {cashierName}</p>}
            </div>
            
            <div className="receipt-items border-t border-b py-4 my-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Item</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items && receiptData.items.map((item, idx) => (
                    <tr key={idx} className="border-b border-dashed last:border-b-0">
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-right">
                        {item.unitType ? 
                          formatQuantityWithUnit(item.quantity, item.unitType) : 
                          item.quantity.toString()}
                      </td>
                      <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                      <td className="py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${receiptData.amount.toFixed(2)}</span>
            </div>
            
            <div className="mt-4 space-y-2 text-sm payment-info">
              <p className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium">{formatPaymentMethod(receiptData.payment_method)}</span>
              </p>
              
              {receiptData.payment_method === 'cash' && receiptData.paymentDetails && (
                <>
                  <p className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span>${receiptData.paymentDetails.amountPaid?.toFixed(2) || receiptData.amount.toFixed(2)}</span>
                  </p>
                  {typeof receiptData.paymentDetails.changeAmount === 'number' && receiptData.paymentDetails.changeAmount > 0 && (
                    <p className="flex justify-between">
                      <span>Change:</span>
                      <span>${receiptData.paymentDetails.changeAmount.toFixed(2)}</span>
                    </p>
                  )}
                </>
              )}
              
              {receiptData.payment_method === 'card' && receiptData.paymentDetails?.reference && (
                <p className="flex justify-between">
                  <span>Card Ending:</span>
                  <span className="font-mono">xxxx-{receiptData.paymentDetails.reference}</span>
                </p>
              )}
              
              {receiptData.payment_method === 'upi' && receiptData.paymentDetails?.reference && (
                <p className="flex justify-between">
                  <span>UPI ID:</span>
                  <span className="font-mono">{receiptData.paymentDetails.reference}</span>
                </p>
              )}
            </div>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row space-y-2 sm:space-y-0">
          <div className="flex space-x-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="flex-1 sm:flex-none"
            >
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Close
            </Button>
          </div>
          <Button 
            onClick={onDownload}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;
