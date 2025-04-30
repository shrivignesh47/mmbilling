
import React, { useEffect, useState } from "react";
import { generateBarcodeSVG, generateQRCode } from "../utils/BarcodeUtils";
import { Button } from "../ui/button";
import { Download, Copy, QrCode, Barcode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface BarcodeDisplayProps {
  value: string;
  productName: string;
}

const BarcodeDisplay = ({ value, productName }: BarcodeDisplayProps) => {
  const [barcodeSrc, setBarcodeSrc] = useState<string>("");
  const [qrCodeSrc, setQrCodeSrc] = useState<string>("");
  
  useEffect(() => {
    if (value) {
      // Generate barcode
      const barcodeImage = generateBarcodeSVG(value);
      setBarcodeSrc(barcodeImage);
      
      // Generate QR code
      generateQRCode(value).then(qrImage => {
        setQrCodeSrc(qrImage);
      });
    }
  }, [value]);

  const downloadImage = (src: string, filename: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  if (!value) return null;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="barcode">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="barcode"><Barcode className="h-4 w-4 mr-2" /> Barcode</TabsTrigger>
          <TabsTrigger value="qrcode"><QrCode className="h-4 w-4 mr-2" /> QR Code</TabsTrigger>
        </TabsList>
        <TabsContent value="barcode" className="flex flex-col items-center space-y-3 p-4 border rounded-md">
          {barcodeSrc && (
            <div className="flex flex-col items-center">
              <img src={barcodeSrc} alt={`Barcode for ${productName}`} className="max-w-full" />
              <p className="text-sm text-center mt-1">{value}</p>
            </div>
          )}
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => downloadImage(barcodeSrc, `barcode-${value}.png`)}>
              <Download className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" /> Copy Code
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="qrcode" className="flex flex-col items-center space-y-3 p-4 border rounded-md">
          {qrCodeSrc && (
            <div className="flex flex-col items-center">
              <img src={qrCodeSrc} alt={`QR Code for ${productName}`} className="max-w-full" />
            </div>
          )}
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => downloadImage(qrCodeSrc, `qrcode-${value}.png`)}>
              <Download className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" /> Copy Code
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BarcodeDisplay;
