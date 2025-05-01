
import React from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProductsHeaderProps {
  shopId?: string;
  openAddProductForm: () => void;
  handleExportAllBarcodes: () => void;
}

const ProductsHeader: React.FC<ProductsHeaderProps> = ({ 
  shopId, 
  openAddProductForm, 
  handleExportAllBarcodes 
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your shop's products
          </p>
        </div>
        <div className="flex gap-2">
          {shopId && (
            <>
              <Button variant="outline" onClick={handleExportAllBarcodes}>
                <FileText className="mr-2 h-4 w-4" />
                Export Barcodes
              </Button>
              <Button onClick={openAddProductForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </>
          )}
        </div>
      </div>

      {!shopId && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};

export default ProductsHeader;
