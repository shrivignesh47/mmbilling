import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Receipt,
  Package,
  Percent,
  IndianRupee,
  Save,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
// Import ProductForm Modal Component
import PurchaseForm from '@/components/products/PurchaseForm';
import { supabase } from "@/integrations/supabase/client";
import BarcodeGenerator from '@/components/products/BarcodeGenerator';
import { generateBarcode } from '@/components/utils/BarcodeGeneratorUtils';
type UnitType =
  | 'kg'
  | 'liter'
  | 'piece'
  | 'pack'
  | 'ml'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | 'xxl'
  | 'xxxl';
import { X } from 'lucide-react'; // Import the X icon

// Interface for Product Data
interface ProductFormData {
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
  mrp: number; // MRP field
  StockPrice: number; // Selling Price field
  w_rate: number; // Weight Rate field
  TotalAmount: number;
}

// Interface for Purchase Entry
interface PurchaseEntry {
  supplier: string;
  state: string;
  gst_no: string;
  purchase_date: string;
  bill_no: string;
  supplier_bill_date: string;
  invoice_type: string;
  bill_image: File | null;
  products: { [key: string]: ProductFormData };
  gross_amount: number;
  discount: number;
  add_charges: number;
  round_off_amount: number;
  net_amount: number;
  isTotalCalculated: boolean;
}

export default function PurchaseEntry() {
  const [entry, setEntry] = useState<PurchaseEntry>({
    supplier: '',
    state: '',
    gst_no: '',
    purchase_date: new Date().toISOString().split('T')[0], // Set current date
    bill_no: '',
    supplier_bill_date: '',
    invoice_type: '',
    bill_image: null,
    products: {},
    gross_amount: 0,
    discount: 0,
    add_charges: 0,
    round_off_amount: 0,
    net_amount: 0,
    isTotalCalculated: false,
  });

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [totalButtonLabel, setTotalButtonLabel] = useState('Total Calculate');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PurchaseEntry, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');

  // Handle adding a new product
  const handleAddProduct = (product: ProductFormData) => {
    const gstRate = product.gstPercentage / 100;
    const totalGST = product.price * product.stock * gstRate;
    const sgst = totalGST / 2;
    const cgst = totalGST / 2;

    // Ensure barcode is generated if not present
    const barcode = product.barcode || generateBarcode({
      id: product.id || `product-${Date.now()}`,
      sku: product.sku
    });

    const updatedProduct = {
      ...product,
      sgst,
      cgst,
      TotalAmount: product.price * product.stock + totalGST,
      barcode, // Include barcode in the product data
    };

    setEntry((prev) => ({
      ...prev,
      products: {
        ...prev.products,
        [product.id || `product-${Date.now()}`]: updatedProduct,
      },
      isTotalCalculated: false, // Reset calculation status
    }));

    setIsProductFormOpen(false);
    setTotalButtonLabel('Re-Calculate Total');
    setSubmitError('');
  };

  // Perform GST calculations
  const calculateAmounts = () => {
    const totalAmount = Object.values(entry.products).reduce(
      (sum, p) => sum + p.TotalAmount,
      0
    );

    const gstRate = 18 / 100;
    const totalGST = totalAmount * gstRate;
    const grossAmount = totalAmount;

    const discountAmount = (grossAmount * entry.discount) / 100;
    const additionalChargesAmount = (grossAmount * entry.add_charges) / 100;

    const afterDiscount = grossAmount - discountAmount;
    const withCharges = afterDiscount + additionalChargesAmount;

    // Round off to the nearest hundred
    const netAmount = totalAmount+totalGST+withCharges;
    const roundOffAmount = Math.round(netAmount / 100) * 100;;

    setEntry((prev) => ({
      ...prev,
      gross_amount: grossAmount,
      round_off_amount: roundOffAmount,
      net_amount: netAmount,
      isTotalCalculated: true, // Mark as calculated
    }));

    setTotalButtonLabel('Total Calculate');
    setSubmitError('');
  };

  // Handle input changes in form fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setEntry((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
      isTotalCalculated: false, // Mark totals as outdated
    }));

    setTotalButtonLabel('Re-Calculate Total');
  };

  // Validate required fields before submission
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PurchaseEntry, string>> = {};

    if (!entry.supplier.trim()) {
      errors.supplier = 'Supplier Name is required.';
      toast.error('Supplier Name is required.');
    }

    if (!entry.state.trim()) {
      errors.state = 'State is required.';
      toast.error('State is required.');
    }

    if (Object.keys(entry.products).length === 0) {
      errors.products = 'At least one product must be added.';
      toast.error('At least one product must be added.');
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };


  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!entry.isTotalCalculated) {
      setSubmitError('Please calculate totals before submitting.');
      toast.error('Please calculate totals before submitting.');
      return;
    }
  
    if (!validateForm()) {
      setSubmitError('Some required fields are missing. Please check above.');
      toast.error('Some required fields are missing. Please check above.');
      return;
    }
    const purchaseDate = entry.purchase_date || new Date().toISOString();
    const supplierBillDate = entry.supplier_bill_date || new Date().toISOString();

 
    
    const userId = localStorage.getItem('user_id');
    // Fetch shop_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching shop_id:', profileError);
      toast.error('Failed to fetch shop ID');
      return;
    }
    
    const shop_id = profileData?.shop_id;
  
    // Convert products object to an array
    const productsArray = Object.values(entry.products);
  
    // Send data to Supabase
    const { data, error } = await supabase
      .from('purchase_entry') // Replace with your table name
      .insert([
        {
          supplier: entry.supplier,
          state: entry.state,
          gst_no: entry.gst_no,
          purchase_date: purchaseDate,
          bill_no: entry.bill_no,
          supplier_bill_date: supplierBillDate,
          invoice_type: entry.invoice_type,
          bill_image: entry.bill_image, // Handle file uploads separately if needed
          products: productsArray, // Send as JSON array
          gross_amount: entry.gross_amount,
          discount: entry.discount,
          add_charges: entry.add_charges,
          round_off_amount: entry.round_off_amount,
          net_amount: entry.net_amount,
          shop_id: shop_id, // Include shop_id
        },
      ]);
  
    if (error) {
      console.error('Error inserting data:', error);
      toast.error('Error inserting data. Please try again.');
      setSubmitError('Failed to submit data. Please try again.');
    } else {
      console.log('Data inserted successfully:', data);
      toast.success('Entry saved successfully!');
      handleReset();
    }
  };

  // Reset form to initial state
  const handleReset = () => {
    setEntry({
      supplier: '',
      state: '',
      gst_no: '',
      purchase_date: new Date().toISOString().split('T')[0],
      bill_no: '',
      supplier_bill_date: '',
      invoice_type: '',
      bill_image: null,
      products: {},
      gross_amount: 0,
      discount: 0,
      add_charges: 0,
      round_off_amount: 0,
      net_amount: 0,
      isTotalCalculated: false,
    });
    setFormErrors({});
    setSubmitError('');
    setTotalButtonLabel('Total Calculate');
  };

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    return `₹${value.toFixed(2)}`;
  };

  // Determine button color based on calculation status
  const getCalculateButtonClass = () => {
    return entry.isTotalCalculated
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-indigo-600 hover:bg-indigo-700';
  };

  // Render product table if any exist
  const renderProductsTable = () => {
    if (Object.keys(entry.products).length === 0) return null;

    return (
      <table className="w-full text-left border-collapse mt-4">
        <thead>
          <tr className="border-b dark:border-slate-700">
            <th className="py-2 px-4">Name</th>
            <th className="py-2 px-4">Category</th>
            <th className="py-2 px-4">Unit Type</th>
            <th className="py-2 px-4">Stock</th>
            <th className="py-2 px-4">Selling Price</th>
            <th className="py-2 px-4">MRP</th>
            <th className="py-2 px-4">GST %</th>
            <th className="py-2 px-4">SGST</th>
            <th className="py-2 px-4">CGST</th>
            <th className="py-2 px-4">Total Amount</th>
            <th className="py-2 px-4">Actions</th> {/* New column for actions */}
          </tr>
        </thead>
        <tbody>
          {Object.entries(entry.products).map(([key, product]) => (
            <tr key={key} className="border-b dark:border-slate-700">
              <td className="py-2 px-4">{product.name}</td>
              <td className="py-2 px-4">{product.category}</td>
              <td className="py-2 px-4">{product.unitType}</td>
              <td className="py-2 px-4">{product.stock}</td>
              <td className="py-2 px-4">{formatCurrency(product.price)}</td>
              <td className="py-2 px-4">{formatCurrency(product.mrp)}</td>
              <td className="py-2 px-4">{product.gstPercentage}%</td>
              <td className="py-2 px-4">{formatCurrency(product.sgst)}</td>
              <td className="py-2 px-4">{formatCurrency(product.cgst)}</td>
              <td className="py-2 px-4">{formatCurrency(product.TotalAmount)}</td>
              <td className="py-2 px-4">
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(key)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Function to handle product removal
  const handleRemoveProduct = (productId: string) => {
    setEntry((prev) => {
      const updatedProducts = { ...prev.products };
      delete updatedProducts[productId];
      return {
        ...prev,
        products: updatedProducts,
        isTotalCalculated: false, // Mark totals as outdated
      };
    });
    setTotalButtonLabel('Re-Calculate Total');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Purchase Entry
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Create new purchase entry with automatic GST calculation
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Supplier Information */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Supplier Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="supplier"
                  value={entry.supplier}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    formErrors.supplier ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {formErrors.supplier && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.supplier}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={entry.state}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    formErrors.state ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none`}
                />
                {formErrors.state && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  name="gst_no"
                  value={entry.gst_no}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bill No
                </label>
                <input
                  type="text"
                  name="bill_no"
                  value={entry.bill_no}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Bill Image
                </label>
                <input
                  type="file"
                  name="bill_image"
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Products Section */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Products <span className="text-red-500">*</span>
            </h2>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setIsProductFormOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                Add Product
              </button>

              {renderProductsTable()}

              {formErrors.products && (
                <p className="mt-2 text-sm text-red-500">{formErrors.products}</p>
              )}
            </div>
          </motion.div>

          {/* Calculations Summary */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              GST Calculations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Gross Amount */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Gross Amount</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(entry.gross_amount)}
                </p>
              </div>

              {/* Discount */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Discount (%)</p>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    name="discount"
                    value={entry.discount}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Additional Charges */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Additional Charges (%)</p>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="number"
                    name="add_charges"
                    value={entry.add_charges}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Net Amount */}
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-sm text-indigo-600 dark:text-indigo-400">Net Amount</p>
                <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                  {formatCurrency(entry.net_amount)}
                </p>
              </div>

              {/* Round Off Amount */}
              <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">Round Off Amount</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(entry.round_off_amount)}
                </p>
              </div>
            </div>

            {/* Calculate Totals Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={calculateAmounts}
                className={`px-4 py-2 ${getCalculateButtonClass()} text-white rounded-lg transition-colors flex items-center gap-2`}
              >
                <Calculator className="h-4 w-4" />
                {totalButtonLabel}
              </button>
              {submitError && (
                <p className="mt-2 text-sm text-red-500">{submitError}</p>
              )}
            </div>
          </motion.div>

          {/* Action Buttons */}
          <div className="col-span-full flex justify-end gap-4">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Entry
            </button>
          </div>
        </form>

        {/* Product Form Modal */}
        <PurchaseForm
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          onSubmit={handleAddProduct}
          productMode="add"
        />
      </motion.div>
    </div>
  );}
