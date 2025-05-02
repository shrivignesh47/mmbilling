
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
    unitType: 'piece'
  });

  const [unitOptions, setUnitOptions] = useState<UnitType[]>(['piece', 'kg', 'liter', 'pack', 'ml']);

  // Update unit options when category changes
  useEffect(() => {
    setUnitOptions(getUnitOptionsForCategory(formData.category));
  }, [formData.category]);
  
  // If category changes and current unit type is not valid for the new category,
  // update the unit type to the first valid option
  useEffect(() => {
    const options = getUnitOptionsForCategory(formData.category);
    if (!options.includes(formData.unitType)) {
      setFormData(prev => ({
        ...prev,
        unitType: options[0]
      }));
    }
  }, [formData.category, formData.unitType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData({
      ...formData,
      [id]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    });
  };

  const handleUnitTypeChange = (value: UnitType) => {
    setFormData({
      ...formData,
      unitType: value
    });
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
    
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>
            
            <div className="space-y-2">
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
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
              
              <div className="space-y-2">
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sku">SKU (Optional)</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={handleChange}
                placeholder="Enter product SKU"
              />
            </div>

            <div className="space-y-2">
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
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">
                Cancel
              </Button>
              <Button type="submit">
                {productMode === 'add' ? 'Add Product' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
          
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;
