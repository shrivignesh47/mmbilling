
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { QrCode, Barcode, Search } from 'lucide-react';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, isScanning, setIsScanning }) => {
  const [manualCode, setManualCode] = useState('');
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [codeBuffer, setCodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);

  // Handle barcode scanner input
  useEffect(() => {
    if (!isScanning) return;

    const scanTimeout = 30; // milliseconds between keystrokes
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime();
      
      // Check if this is part of a scan (keystrokes close together)
      if (currentTime - lastKeyTime <= scanTimeout || codeBuffer === '') {
        // Add to buffer if printable character or Enter
        if (e.key.length === 1 || e.key === 'Enter') {
          setLastKeyTime(currentTime);
          
          if (e.key === 'Enter') {
            // Submit the scanned code when Enter is pressed
            if (codeBuffer && codeBuffer !== lastScannedCode) {
              onScan(codeBuffer);
              setLastScannedCode(codeBuffer);
              toast.success(`Scanned: ${codeBuffer}`);
            }
            setCodeBuffer('');
          } else {
            setCodeBuffer(prev => prev + e.key);
          }
        }
      } else {
        // Too much time elapsed, reset the buffer
        setCodeBuffer(e.key.length === 1 ? e.key : '');
        setLastKeyTime(currentTime);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScanning, lastKeyTime, codeBuffer, lastScannedCode, onScan]);

  const handleSubmitManualCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Barcode Scanner</h3>
        <Button 
          variant={isScanning ? "default" : "outline"} 
          onClick={() => setIsScanning(!isScanning)}
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
          <div className="text-center mb-3">
            <QrCode className="h-6 w-6 mx-auto mb-1" />
            <p className="text-sm">Scan a barcode or QR code to add product to bill</p>
          </div>
          
          {codeBuffer && (
            <div className="text-center text-sm text-muted-foreground animate-pulse">
              Reading: {codeBuffer}
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
              placeholder="Enter barcode manually"
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
