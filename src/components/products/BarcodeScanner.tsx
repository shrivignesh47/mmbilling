import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { QrCode, Barcode, Search } from 'lucide-react';
import { toast } from 'sonner';
import QrReader from 'react-qr-scanner'; // Updated import

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, isScanning, setIsScanning }) => {
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleScan = (data: any) => {
    if (data && data !== lastScannedCode) {
      onScan(data);
      setManualCode(data);  // Update manual code with scanned value
      setLastScannedCode(data);
      setScanError(null);
      toast.success(`Scanned: ${data}`);
    }
  };

  const handleError = (error: any) => {
    console.error("Error scanning barcode:", error);
    setScanError("Unable to detect barcode. Please try again.");
  };

  const handleSubmitManualCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      toast.success(`Manual Entry: ${manualCode.trim()}`);
      setLastScannedCode(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Barcode Scanner</h3>
        <Button 
          variant={isScanning ? "default" : "outline"} 
          onClick={() => {
            setIsScanning(!isScanning);
            console.log("Scanner toggled:", !isScanning);
          }}
          size="sm"
        >
          {isScanning ? (
            <>
              <QrCode className="mr-2 h-4 w-4" />
              Scanning Active
            </>
          ) : (
            <>
              <Barcode className="mr-2 h-4 w-4" />
              Start Scanning
            </>
          )}
        </Button>
      </div>
      
      {isScanning && (
        <div className="p-4 border rounded-md bg-muted/30">
          <QrReader
            delay={300}
            onError={handleError}
            onScan={handleScan}
            style={{ width: '100%' }}
          />
          {scanError && (
            <div className="text-center mt-2 text-sm text-red-500">
              {scanError}
            </div>
          )}
          {lastScannedCode && (
            <div className="text-center mt-2 text-sm">
              Last scanned: <span className="font-mono">{lastScannedCode}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4">
        <form onSubmit={handleSubmitManualCode} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={manualCode || "Enter barcode manually"}
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
      </div>
    </div>
  );
};

export default BarcodeScanner;
