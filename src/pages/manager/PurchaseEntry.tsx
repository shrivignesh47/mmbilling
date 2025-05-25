import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Receipt,
  Package,
  Percent,
  IndianRupee,
  Save,
  RefreshCw,
  Upload,
  Download,
  FileText,
  UserPlus,
  Search,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
// Import ProductForm Modal Component
import PurchaseForm from '@/components/products/PurchaseForm';
import { supabase } from "@/integrations/supabase/client";
import { generateBarcode } from '@/components/utils/BarcodeGeneratorUtils';
import * as XLSX from 'xlsx';
import FileSaver from 'file-saver';
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
  shop_id?: string; // Add shop_id field
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
  saveSupplier: boolean; // Add this flag to indicate if supplier should be saved
  payment_status: 'Paid' | 'Unpaid' | 'Partially Paid';
  payment_mode: string;
  paid_amount: number;
  balance_amount: number;
  credit_days: number;
  due_date: string;
}
// Add Supplier interface
interface Supplier {
  id: string;
  name: string;
  state: string;
  gst_number: string;
  shop_id: string;
  credit_days?: number;
  credit_limit?: number;
  outstanding_balance?: number;
  payment_status?: 'Paid' | 'Unpaid' | 'Partially Paid';
  payment_mode?: string;
  paid_amount?: number;
  balance_amount?: number;
  due_date?: string;
}
export default function PurchaseEntry() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  
  const generateExcelTemplate = () => {
    const templateData = [
      {
        'Product Name': 'Sample Product',
        'Category': 'Clothing',
        'SKU': 'SKU123',
        'Unit Type': 'piece',
        'Stock': 100,
        'MRP (₹)': 150,
        'Stock Price (₹)': 120,
        'Selling Price (₹)': 130,
        'Weight Rate': 0,
        'GST Percentage': 18
      },
      {
        'Product Name': 'Sample Vegetable',
        'Category': 'Vegetables',
        'SKU': 'VEG001',
        'Unit Type': 'kg',
        'Stock': 50,
        'MRP (₹)': 80,
        'Stock Price (₹)': 60,
        'Selling Price (₹)': 70,
        'Weight Rate': 70,
        'GST Percentage': 5
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    const wscols = [
      { wch: 20 }, // Product Name
      { wch: 15 }, // Category
      { wch: 10 }, // SKU
      { wch: 10 }, // Unit Type
      { wch: 8 }, // Stock
      { wch: 10 }, // MRP
      { wch: 15 }, // Stock Price
      { wch: 15 }, // Selling Price
      { wch: 12 }, // Weight Rate
      { wch: 15 }, // GST Percentage
    ];
    worksheet['!cols'] = wscols;

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    FileSaver.saveAs(data, 'product_template.xlsx');
    
    toast.success('Template downloaded successfully!');
  };
  const [entry, setEntry] = useState<PurchaseEntry>({
    supplier: '',
    state: '',
    gst_no: '',
    purchase_date: new Date().toISOString().split('T')[0], // Set current date
    bill_no: '',
    supplier_bill_date: '',
    invoice_type: 'Purchase_Inventory',
    bill_image: null,
    products: {},
    gross_amount: 0,
    discount: 0,
    add_charges: 0,
    round_off_amount: 0,
    net_amount: 0,
    isTotalCalculated: false,
    saveSupplier: false, // Initialize to false
    payment_status: 'Unpaid',
    payment_mode: 'Cash',
    paid_amount: 0,
    balance_amount: 0,
    credit_days: 30,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  useEffect(() => {
    fetchSuppliers();
  }, []);
  const fetchSuppliers = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast.error('User ID not found');
        return;
      }

      // Get shop_id from profiles table
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

      // Fetch suppliers for this shop
      const { data, error } = await supabase
        .from('supplier')
        .select('*')
        .eq('shop_id', shop_id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Failed to load suppliers');
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  };
  const handleSupplierSearch = (searchTerm: string) => {
    // Update the supplier field in the entry state
    setEntry(prev => ({
      ...prev,
      supplier: searchTerm
    }));
    
    // Filter suppliers based on search term
    if (searchTerm.trim() === '') {
      setFilteredSuppliers([]);
      setShowSupplierDropdown(false);
    } else {
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowSupplierDropdown(true);
    }
  };
  const handleSupplierSelect = (supplier: Supplier) => {
    const purchaseDate = new Date(entry.purchase_date);
    const creditDays = supplier.credit_days || 30;
    const dueDate = new Date(purchaseDate);
    dueDate.setDate(dueDate.getDate() + creditDays);
    setEntry(prev => ({
      ...prev,
      supplier: supplier.name,
      state: supplier.state || '',
      gst_no: supplier.gst_number || '',
      credit_days: creditDays,
      due_date: dueDate.toISOString().split('T')[0]
    }));
    setShowSupplierDropdown(false);
  };

  const updatePaymentFields = (paidAmount: number) => {
    const netAmount = entry.net_amount;
    const balance = netAmount - paidAmount;
    let status: 'Paid' | 'Unpaid' | 'Partially Paid' = 'Unpaid';
    
    if (paidAmount >= netAmount) {
      status = 'Paid';
    } else if (paidAmount > 0) {
      status = 'Partially Paid';
    }
    
    setEntry(prev => ({
      ...prev,
      paid_amount: paidAmount,
      balance_amount: balance > 0 ? balance : 0,
      payment_status: status
    }));
  };
  
  // Add click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.supplier-dropdown-container')) {
        setShowSupplierDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const updateDueDate = (days: number) => {
    const purchaseDate = new Date(entry.purchase_date);
    const dueDate = new Date(purchaseDate);
    dueDate.setDate(dueDate.getDate() + days);
    
    setEntry(prev => ({
      ...prev,
      credit_days: days,
      due_date: dueDate.toISOString().split('T')[0]
    }));
  };
  
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [totalButtonLabel, setTotalButtonLabel] = useState('Total Calculate');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PurchaseEntry, string>>>({});
  const [submitError, setSubmitError] = useState<string>('');

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Fetch shop_id for all products
          const userId = localStorage.getItem('user_id');
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
          
          // Create a new products object to hold all products
          const newProducts = { ...entry.products };
          
          // Process each product from Excel
          let productsAdded = 0;
          let productsWithErrors = 0;
          
          for (const item of jsonData) {
            try {
              // Map Excel columns to product fields
              const product: ProductFormData = {
                name: item['Product Name'] || '',
                category: item['Category'] || '',
                sku: item['SKU'] || '',
                unitType: (item['Unit Type'] || 'piece') as UnitType,
                stock: Number(item['Stock'] || 0),
                mrp: Number(item['MRP (₹)'] || 0),
                StockPrice: Number(item['Stock Price (₹)'] || 0),
                price: Number(item['Selling Price (₹)'] || 0),
                w_rate: Number(item['Weight Rate'] || 0),
                gstPercentage: Number(item['GST Percentage'] || 18),
                sgst: 0, // Will be calculated
                cgst: 0, // Will be calculated
                TotalAmount: 0, // Will be calculated
                shop_id: shop_id
              };

              // Validate required fields
              if (!product.name || !product.category || product.stock <= 0 || product.price <= 0) {
                productsWithErrors++;
                continue;
              }

              // Calculate GST values
              const gstRate = product.gstPercentage / 100;
              const totalGST = product.price * product.stock * gstRate;
              const sgst = totalGST / 2;
              const cgst = totalGST / 2;

              // Generate a unique ID for this product
              const productId = `product-${Date.now()}-${productsAdded}`;
              
              // Ensure barcode is generated
              const barcode = product.barcode || generateBarcode({
                id: product.id || productId,
                sku: product.sku
              });

              // Add the processed product to our new products object
              newProducts[productId] = {
                ...product,
                id: productId,
                barcode,
                sgst,
                cgst,
                TotalAmount: product.price * product.stock + totalGST
              };
              
              productsAdded++;
            } catch (error) {
              console.error('Error processing product:', error);
              productsWithErrors++;
            }
          }

          // Update state with all products at once
          setEntry(prev => ({
            ...prev,
            products: newProducts,
            isTotalCalculated: false
          }));

          // Show results
          if (productsAdded > 0) {
            toast.success(`Successfully added ${productsAdded} products`);
            // Calculate totals automatically after a short delay to ensure state is updated
            setTimeout(() => calculateAmounts(), 100);
          }
          
          if (productsWithErrors > 0) {
            toast.warning(`${productsWithErrors} products had errors and were skipped`);
          }
          
          // Clear the file input
          e.target.value = '';
        } catch (error) {
          console.error('Error parsing Excel file:', error);
          toast.error('Failed to parse Excel file. Please check the format.');
        }
      };
      
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error reading file:', error);
      toast.error('Error reading file');
    }
  };
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (name === 'supplier') {
      handleSupplierSearch(value);
    } else if (name === 'paid_amount') {
      const paidAmount = parseFloat(value) || 0;
      updatePaymentFields(paidAmount);
    } else if (name === 'credit_days') {
      const days = parseInt(value) || 30;
      updateDueDate(days);
    } else if (name === 'purchase_date') {
      // Update due date when purchase date changes
      setEntry(prev => {
        const newPurchaseDate = new Date(value);
        const dueDate = new Date(newPurchaseDate);
        dueDate.setDate(dueDate.getDate() + prev.credit_days);
        
        return {
          ...prev,
          purchase_date: value,
          due_date: dueDate.toISOString().split('T')[0],
          isTotalCalculated: false
        };
      });
    } else {
      setEntry((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
        isTotalCalculated: false, // Mark totals as outdated
      }));
    }
    
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
    const supplierBillDate = entry.supplier_bill_date ? new Date(entry.supplier_bill_date).toISOString() : null;

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
    if (entry.supplier.trim()) {
      // Check if supplier with same name already exists
      const { data: existingSupplier, error: supplierCheckError } = await supabase
        .from('supplier')
        .select('id, purchase_date, payment_status, paid_amount, balance_amount')
        .eq('name', entry.supplier.trim())
        .eq('shop_id', shop_id)
        .maybeSingle();
        
      if (supplierCheckError) {
        console.error('Error checking for existing supplier:', supplierCheckError);
      } else if (!existingSupplier) {
        // Supplier doesn't exist, create a new one
        const { error: supplierError } = await supabase
          .from('supplier')
          .insert([
            {
              name: entry.supplier.trim(),
              state: entry.state,
              gst_number: entry.gst_no,
              shop_id: shop_id,
              is_active: true,
              credit_days: entry.credit_days,
              payment_status: entry.payment_status,
              payment_mode: entry.payment_mode,
              paid_amount: entry.paid_amount,
              balance_amount: entry.balance_amount,
              due_date: entry.due_date,
              purchase_date: entry.purchase_date,
              bill_date: supplierBillDate,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ]);
          
        if (supplierError) {
          console.error('Error saving supplier:', supplierError);
          toast.error('Failed to save supplier information');
        } else if (entry.saveSupplier) {
          toast.success('Supplier added to your supplier list');
        }
      } else {
        // Check if there's an entry with the same purchase date
        const { data: existingPurchaseData, error: purchaseCheckError } = await supabase
          .from('supplier')
          .select('id')
          .eq('name', entry.supplier.trim())
          .eq('shop_id', shop_id)
          .eq('purchase_date', entry.purchase_date)
          .maybeSingle();
          
        if (purchaseCheckError) {
          console.error('Error checking for existing purchase date:', purchaseCheckError);
        } else if (existingPurchaseData) {
          // Update existing entry with same purchase date
          const { data: supplierData, error: getSupplierError } = await supabase
            .from('supplier')
            .select('outstanding_balance, balance_amount, paid_amount')
            .eq('id', existingPurchaseData.id)
            .single();
            
          if (!getSupplierError && supplierData) {
            const currentOutstandingBalance = supplierData.outstanding_balance || 0;
            const currentBalanceAmount = supplierData.balance_amount || 0;
            
            // Calculate new values
            const newOutstandingBalance = currentOutstandingBalance + entry.net_amount;
            const newBalanceAmount = currentBalanceAmount + entry.balance_amount;
            
            // Determine payment status
            let paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid' = entry.payment_status;
            
            const { error: updateError } = await supabase
              .from('supplier')
              .update({ 
                outstanding_balance: newOutstandingBalance,
                balance_amount: newBalanceAmount,
                paid_amount: entry.paid_amount,
                payment_status: paymentStatus,
                payment_mode: entry.payment_mode,
                credit_days: entry.credit_days,
                due_date: entry.due_date,
                bill_date: supplierBillDate,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingPurchaseData.id);
              
            if (updateError) {
              console.error('Error updating supplier payment info:', updateError);
            }
          }
        } else {
          // Create a new entry for this supplier with different purchase date
          const { error: newEntryError } = await supabase
            .from('supplier')
            .insert([
              {
                name: entry.supplier.trim(),
                state: entry.state,
                gst_number: entry.gst_no,
                shop_id: shop_id,
                is_active: true,
                credit_days: entry.credit_days,
                payment_status: entry.payment_status,
                payment_mode: entry.payment_mode,
                paid_amount: entry.paid_amount,
                balance_amount: entry.balance_amount,
                due_date: entry.due_date,
                purchase_date: entry.purchase_date,
                bill_date: supplierBillDate,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);
            
          if (newEntryError) {
            console.error('Error creating new supplier entry:', newEntryError);
            toast.error('Failed to create new supplier entry');
          }
        }
      }
    }
    // Convert products object to an array
    const productsArray = Object.values(entry.products);
  
    // Send data to Supabase
    const { data, error } = await supabase
      .from('purchase_entry')
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
          credit_days: entry.credit_days,
          due_date: entry.due_date,
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
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
 
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
      saveSupplier: false,
      payment_status: 'Unpaid',
      payment_mode: 'Cash',
      paid_amount: 0,
      balance_amount: 0,
      credit_days: 30,
      due_date: thirtyDaysFromNow.toISOString().split('T')[0],
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
            
            <div className="mb-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={entry.saveSupplier}
                  onChange={(e) => setEntry(prev => ({ ...prev, saveSupplier: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                  <UserPlus className="h-4 w-4 mr-1 text-indigo-600" />
                  Save as new supplier
                </span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="relative supplier-dropdown-container">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="supplier"
                    value={entry.supplier}
                    onChange={handleChange}
                    onFocus={() => {
                      if (entry.supplier.trim() !== '') {
                        setShowSupplierDropdown(true);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      formErrors.supplier ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
                    } bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none pl-10`}
                    placeholder="Type to search suppliers..."
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <ChevronDown 
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer" 
                    onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                  />
                </div>
                
                {showSupplierDropdown && filteredSuppliers.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                    {filteredSuppliers.map(supplier => (
                      <div
                        key={supplier.id}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-800 dark:text-slate-200"
                        onClick={() => handleSupplierSelect(supplier)}
                      >
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {supplier.state} • GST: {supplier.gst_number || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
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
                  Bill Date
                </label>
                <input
                  type="date"
                  name="supplier_bill_date"
                  value={entry.supplier_bill_date}
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
              <div className="flex flex-row gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  Add Product
                </button>
                
                <button
                  type="button"
                  onClick={generateExcelTemplate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
                
                <div className="relative">
                  <input
                    type="file"
                    id="excel-upload"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Excel
                  </button>
                </div>
              </div>

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
{/* Payment Information */}
<motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              Payment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Status
                </label>
                <select
                  name="payment_status"
                  value={entry.payment_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Payment Mode
                </label>
                <select
                  name="payment_mode"
                  value={entry.payment_mode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Paid Amount (₹)
                </label>
                <input
                  type="number"
                  name="paid_amount"
                  value={entry.paid_amount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Balance Amount (₹)
                </label>
                <input
                  type="number"
                  name="balance_amount"
                  value={entry.balance_amount}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Credit Days
                </label>
                <input
                  type="number"
                  name="credit_days"
                  value={entry.credit_days}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={entry.due_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
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
