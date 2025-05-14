
import React, { forwardRef } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, Share2 } from "lucide-react";
import { Transaction } from "./types";
import { formatQuantityWithUnit, UnitType } from "@/components/utils/UnitUtils";
import { formatPaymentMethod } from "@/components/utils/BillingUtils";
import { toast } from 'sonner';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: Transaction | null;
  shopName?: string;
  shopAddress?: string;
  cashierName?: string;
  onDownload: () => void;
}

const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  isOpen,
  onClose,
  receiptData,
  shopName,
  shopAddress,
  cashierName,
  onDownload
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getChangeAmount = () => {
    if (!receiptData?.payment_details || receiptData.payment_method !== 'cash') {
      return null;
    }
    
    const cashDetails = receiptData.payment_details;
    if (typeof cashDetails.amountPaid === 'number' && 
        typeof cashDetails.changeAmount === 'number') {
      return {
        amountPaid: cashDetails.amountPaid,
        changeAmount: cashDetails.changeAmount
      };
    }
    
    return null;
  };

  const getReference = () => {
    if (!receiptData?.payment_details) return null;
    
    const details = receiptData.payment_details;
    if (details.reference) {
      return details.reference;
    }
    
    return null;
  };

  const changeInfo = getChangeAmount();
  const reference = getReference();

  const handleWhatsAppShare = async () => {
    try {
      // First, trigger the download to get the PDF
      await onDownload();
      
      // Create the WhatsApp share URL
      const message = encodeURIComponent(`Receipt from ${shopName || 'Shop'}\nTransaction #${receiptData?.transaction_id}`);
      const whatsappUrl = `https://web.whatsapp.com/send?text=${message}`;
      
      // Open WhatsApp Web in a new window
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      toast.error('Failed to share receipt via WhatsApp');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center">
          <div className="text-lg font-bold">Receipt</div>
        </DialogHeader>
        
        {receiptData ? (
          <div ref={ref => {
            if (ref) {
              // Access through DOM is needed for exporting to download
              // @ts-ignore
              window.receiptRef = ref;
            }
          }}>
            <div className="receipt bg-white text-black p-4">
              <div className="header text-center mb-4">
                <h2 className="text-xl font-bold mb-1">{shopName || 'Shop Receipt'}</h2>
                {shopAddress && <p className="text-sm">{shopAddress}</p>}
                <p className="text-sm mt-2">
                  {formatDate(receiptData.created_at)}
                </p>
                <p className="text-sm"># {receiptData.transaction_id}</p>
              </div>
              
              <div className="border-t border-b py-2 mb-3">
                <div className="grid grid-cols-4 text-sm font-medium">
                  <div className="col-span-2">Item</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Price</div>
                </div>
              </div>
              
              <div className="items space-y-2">
                {receiptData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-4 text-sm">
                    <div className="col-span-2">{item.name}</div>
                    <div className="text-right">
                      {item.unitType ? formatQuantityWithUnit(item.quantity, item.unitType as UnitType) : item.quantity}
                    </div>
                    <div className="text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-4 pt-2">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>₹{receiptData.amount.toFixed(2)}</span>
                </div>
                
                <div className="payment-info mt-4 text-sm">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span>{formatPaymentMethod(receiptData.payment_method)}</span>
                  </div>
                  
                  {changeInfo && (
                    <>
                      {/* <div className="flex justify-between mt-1">
                        <span>Amount Paid:</span>
                        <span>₹{changeInfo.amountPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Change:</span>
                        <span>₹{changeInfo.changeAmount.toFixed(2)}</span>
                      </div> */}
                    </>
                  )}
                  
                  {reference && (
                    <div className="flex justify-between mt-1">
                      <span>Reference:</span>
                      <span>{reference}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {cashierName && (
                <div className="text-center mt-6 text-sm">
                  <p>Served by: {cashierName}</p>
                </div>
              )}
              
              <div className="text-center mt-4 text-sm">
                <p>Thank you!</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-center">No receipt data available</div>
        )}
        
        <DialogFooter className="flex flex-wrap gap-2">
          <Button 
            className="flex-1 min-w-[120px]" 
            variant="outline"
            onClick={onClose}
          >
            Close
          </Button>
          <Button 
            className="flex-1 min-w-[120px]"
            onClick={() => window.print()}
            disabled={!receiptData}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            className="flex-1 min-w-[120px]" 
            onClick={onDownload}
            disabled={!receiptData}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button 
            className="flex-1 min-w-[120px]"
            onClick={handleWhatsAppShare}
            disabled={!receiptData}
            variant="default"
          >
            <Share2 className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDialog;
