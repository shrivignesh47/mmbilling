import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BarcodeGenerator from '@/components/products/BarcodeGenerator';
import { generateBarcode } from '@/components/utils/BarcodeGeneratorUtils';
import { UnitType, getUnitOptionsForCategory } from '@/components/utils/UnitUtils';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: ProductFormData) => void;
  productMode: 'add' | 'edit';
  initialData?: ProductFormData;
  exportBarcodes?: () => void;
}

export interface ProductFormData {
  id?: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  sku: string;
  barcode?: string;
  unitType: UnitType;
  gstPercentage: number;
  sgst: number;
  cgst: number;
  mrp: number; // Add MRP field
  StockPrice : number; // Add Selling Price field
  w_rate: number; // Add Weight Rate field
  TotalAmount: number; // Add Amount field
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productMode,
  initialData,
  exportBarcodes
}) => {
  const [formData, setFormData] = useState<ProductFormData>(initialData || {
    name: '',
    category: '',
    price: 0,
    stock: 0,
    sku: '',
    unitType: 'piece',
    gstPercentage: 18,
    sgst: 0,
    cgst: 0,
    mrp: 0, // Initialize MRP
    StockPrice : 0, // Initialize Selling Price
    w_rate: 0, // Initialize Weight Rate
    TotalAmount: 0, // Initialize Amount
  });

  const [unitOptions, setUnitOptions] = useState<UnitType[]>(['piece', 'kg', 'liter', 'pack', 'ml']);
  const [isGSTEnabled, setIsGSTEnabled] = useState<boolean>(false);

  // Update unit options when category changes
  useEffect(() => {
    setUnitOptions(getUnitOptionsForCategory(formData.category));
  }, [formData.category]);

  // Calculate SGST, CGST, and TotalAmount whenever price, GST percentage, or GST checkbox changes
  useEffect(() => {
    let sgst = 0;
    let cgst = 0;
    let totalAmount = formData.price;

    if (isGSTEnabled) {
      const gstRate = formData.gstPercentage / 100;
      const totalGST = formData.price * gstRate;
      sgst = totalGST / 2;
      cgst = totalGST / 2;
      totalAmount += totalGST;
    }

    setFormData(prev => ({
      ...prev,
      sgst,
      cgst,
      TotalAmount: totalAmount
    }));
  }, [formData.price, formData.gstPercentage, isGSTEnabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    });
  };

  const handleGSTCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsGSTEnabled(e.target.checked);
  };

  const handleUnitTypeChange = (value: string) => {
    // Validate that the value is a valid UnitType
    const validUnitTypes: UnitType[] = ['kg', 'liter', 'piece', 'pack', 'ml', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    if (validUnitTypes.includes(value as UnitType)) {
      setFormData({
        ...formData,
        unitType: value as UnitType
      });
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value
    });
  };

  const predefinedCategories = [
    'Clothing',
    'Vegetables', 
    'Fruits',
    'Dairy', 
    'Beverages',
    'Bakery',
    'Prepared Food',
    'Canned Goods',
    'Snacks',
    'Household',
    'Personal Care',
    'Electronics'
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate barcode if not already present
    if (!formData.barcode && formData.id) {
      formData.barcode = generateBarcode({
        id: formData.id,
        sku: formData.sku
      });
    }

    // Debug: Log formData to verify fields before sending
    console.log('Submitting formData:', formData);

    onSubmit(formData);
  };

  const weightCategories = ['Vegetables', 'Fruits', 'Dairy', 'Packaged Food','Beverages','Canned Goods'];

  const isWeightCategory = weightCategories.includes(formData.category);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-4">
        <DialogHeader>
          <DialogTitle>
            {productMode === 'add' ? 'Add New Product' : 'Edit Product'}
          </DialogTitle>
          <DialogDescription>
            {productMode === 'add'
              ? 'Add a new product to your inventory'
              : 'Update product information'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {predefinedCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Enter product SKU"
              />
            </div>
            <div>
              <Label htmlFor="unitType">Unit Type</Label>
              <Select 
                value={formData.unitType}
                onValueChange={handleUnitTypeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit === 'kg' ? 'Kilogram (kg)' :
                       unit === 'liter' ? 'Liter (L)' :
                       unit === 'ml' ? 'Milliliter (ml)' :
                       unit === 'piece' ? 'Piece (pcs)' :
                       unit === 'pack' ? 'Pack' :
                       unit.toUpperCase() + ' (Size)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={formData.stock}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="mrp">MRP (₹)</Label>
              <Input
                id="mrp"
                type="number"
                min="0"
                step="0.01"
                value={formData.mrp}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="StockPrice">StockPrice (₹)</Label>
              <Input
                id="StockPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.StockPrice}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="price">SellingPrice (₹)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="w_rate">Weight Rate</Label>
              <Input
                id="w_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.w_rate}
                onChange={handleChange}
                required={isWeightCategory}
                disabled={!isWeightCategory}
              />
            </div>
            <div>
              <Label htmlFor="gstPercentage">GST Percentage</Label>
              <Input
                id="gstPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.gstPercentage}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="sgst">SGST</Label>
              <Input
                id="sgst"
                type="number"
                min="0"
                step="0.01"
                value={formData.sgst}
                readOnly
              />
            </div>
            <div>
              <Label htmlFor="cgst">CGST</Label>
              <Input
                id="cgst"
                type="number"
                min="0"
                step="0.01"
                value={formData.cgst}
                readOnly
              />
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex items-center gap-2">
              <Input
                id="gstCheckbox"
                type="checkbox"
                checked={isGSTEnabled}
                onChange={handleGSTCheckboxChange}
                className="h-4 w-4"
              />
              <Label htmlFor="gstCheckbox" className="text-sm">
                Apply GST
              </Label>
            </div>
            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <Label htmlFor="TotalAmount">Total Amount (₹)</Label>
              <Input
                id="TotalAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.TotalAmount}
                readOnly
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="mr-2">
              Cancel
            </Button>
            <Button type="submit">
              {productMode === 'add' ? 'Add Product' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
        
        {/* Remove this block to hide Product Barcode in edit form */}
        {/* 
        {productMode === 'edit' && formData.id && (
          <BarcodeGenerator 
            product={{
              id: formData.id,
              name: formData.name,
              sku: formData.sku,
              barcode: formData.barcode
            }}
            onExportBarcodes={exportBarcodes}
          />
        )}
        */}
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
