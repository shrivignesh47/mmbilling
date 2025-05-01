
import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Barcode, Download, FileText } from 'lucide-react';
import { renderBarcodeToCanvas, downloadBarcode, generateBarcode } from '@/components/utils/BarcodeGeneratorUtils';

interface BarcodeGeneratorProps {
  product: {
    id: string;
    name: string;
    sku?: string | null;
    barcode?: string;
  };
  onExportBarcodes?: () => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ product, onExportBarcodes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!product.id) return;
    
    const barcodeValue = product.barcode || generateBarcode(product);
    renderBarcodeToCanvas(canvasRef.current, barcodeValue);
  }, [product]);
  
  const handleDownload = () => {
    downloadBarcode(canvasRef.current, product.name);
  };
  
  return (
    <Card>
      <CardContent className="pt-4 flex flex-col items-center">
        <div className="flex items-center space-x-2 mb-3">
          <Barcode className="h-5 w-5" />
          <span className="font-medium">Product Barcode</span>
        </div>
        
        <div className="w-full bg-white p-4 mb-3 rounded-md">
          <canvas ref={canvasRef} className="w-full"></canvas>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          
          {onExportBarcodes && (
            <Button size="sm" variant="outline" onClick={onExportBarcodes}>
              <FileText className="h-4 w-4 mr-1" />
              Export All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeGenerator;
