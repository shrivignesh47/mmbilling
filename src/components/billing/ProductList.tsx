
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Package, FileText, QrCode } from "lucide-react";
import { Product } from "./types";
import BarcodeScanner from "@/components/products/BarcodeScanner";
import ProductCard from "./ProductCard";
import { toast } from 'sonner';

interface ProductListProps {
  products: Product[];
  filteredProducts: Product[];
  categories: string[];
  searchTerm: string;
  selectedCategory: string | null;
  isScanning: boolean;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setIsScanning: (scanning: boolean) => void;
  handleAddToBill: (product: Product) => void;
  handleBarcodeScanned: (barcode: string) => void;
  handleExportProducts: () => void;
}

const ProductList: React.FC<ProductListProps> = ({
  products,
  filteredProducts,
  categories,
  searchTerm,
  selectedCategory,
  isScanning,
  setSearchTerm,
  setSelectedCategory,
  setIsScanning,
  handleAddToBill, // Ensure this function is passed correctly
  handleExportProducts
}) => {

  const handleLocalBarcodeScanned = (barcode: string) => {
    const scannedProduct = products.find(product => product.barcode === barcode);
    if (scannedProduct) {
      handleAddToBill(scannedProduct); // Add scanned product to bill
      toast.success(`Product added: ₹{scannedProduct.name}`);
    } else {
      toast.error("Product not found for scanned barcode.");
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle>Products</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportProducts}
            >
              <FileText className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant={isScanning ? "default" : "outline"} 
              size="sm"
              onClick={() => setIsScanning(!isScanning)}
            >
              <QrCode className="h-4 w-4 mr-1" />
              {isScanning ? 'Stop Scanning' : 'Scan Products'}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isScanning && (
            <BarcodeScanner 
              onScan={handleLocalBarcodeScanned} // Use the renamed local function
              isScanning={isScanning}
              setIsScanning={setIsScanning}
            />
          )}
          
          {/* Category filter pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 max-h-[400px] overflow-y-auto p-6">
        {filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product}
            onAddToBill={handleAddToBill}
          />
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium mb-1">No products found</h3>
            <p className="text-sm text-center text-muted-foreground">
              {products.length === 0 
                ? "No products are available in the inventory." 
                : "Try adjusting your search terms."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductList;
