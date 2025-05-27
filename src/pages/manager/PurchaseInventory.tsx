import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  Calendar,
  FileText,
  IndianRupee,
  X,
  Eye,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Loader2,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function PurchaseInventory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockTransferred, setIsStockTransferred] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(null);
  const [modalLoading] = useState(false);

  // Fetch suppliers from Supabase
  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase.from('supplier').select('*');
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load supplier information');
    }
  };

  // Fetch purchase entries and products from Supabase
  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data: purchaseEntries, error: entryError } = await supabase.from('purchase_entry').select('*');
      if (entryError) throw entryError;

      const { data: purchaseProducts, error: productsError } = await supabase.from('purchase_entry_products').select('*');
      if (productsError) throw productsError;

      // Map products to their respective entries
      let combinedData = purchaseEntries.map(entry => ({
        ...entry,
        products: purchaseProducts.filter(product => product.purchase_entry_id === entry.id),
      }));

      // Enrich with supplier information
      if (suppliers.length > 0) {
        combinedData = combinedData.map(entry => {
          const supplierInfo = suppliers.find(s => s.name === entry.supplier);
          return {
            ...entry,
            supplier: supplierInfo?.name || entry.supplier,
            gst_no: supplierInfo?.gst_no || entry.gst_no,
            state: supplierInfo?.state || 'Tamil Nadu',
            address: supplierInfo?.address || entry.address,
            contact: supplierInfo?.contact || 'N/A',
            email: supplierInfo?.email || 'N/A',
          };
        });
      }

      setEntries(combinedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load purchase entries');
    } finally {
      setLoading(false);
    }
  };

  

  // Handle viewing details of a selected entry
  const handleViewDetails = async (entry) => {
    setIsModalOpen(true);
    try {
      if (entry.supplier) {
        const { data, error } = await supabase.from('supplier').select('*').eq('name', entry.supplier).single();
        if (!error && data) {
          setSelectedEntry({
            ...entry,
            gst_no: data.gst_number || entry.gst_no || 'N/A',
            state: data.state || entry.state || 'Tamil Nadu',
            address: data.address || entry.address || 'N/A',
            city: data.city || entry.city || 'N/A',
            pincode: data.pincode || entry.pincode || 'N/A',
            contact_person: data.contact_person || entry.contact_person || 'N/A',
            contact: data.phone || entry.contact || 'N/A',
            email: data.email || entry.email || 'N/A',
            payment_status: data.payment_status || entry.payment_status || 'N/A',
            payment_mode: data.payment_mode || entry.payment_mode || 'N/A',
            outstanding_balance: data.outstanding_balance || entry.outstanding_balance || null,
            balance_amount: data.balance_amount || entry.balance_amount || 0,
            paid_amount: data.paid_amount || entry.paid_amount || 0,
            credit_days: data.credit_days || entry.credit_days || 0,
            due_date: data.due_date || entry.due_date || null,
          });
        } else {
          setSelectedEntry(entry);
        }
      } else {
        setSelectedEntry(entry);
      }
    } catch (error) {
      console.error('Error fetching supplier details:', error);
      setSelectedEntry(entry);
    }
  };

  // Close the modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  // Handle stock transfer
  const handleStockTransfer = async (entryId) => {
    try {
      setTransferLoading(entryId);
      const { error } = await supabase.from('purchase_entry')
        .update({ invoice_type: 'Transferred_Inventory' })
        .eq('id', entryId);
      if (error) throw error;
      setIsStockTransferred(true);
      toast.success('Stocks Transferred to Inventory');
      fetchEntries(); // Refresh the list
    } catch (error) {
      console.error('Error transferring stock:', error);
      toast.error('Failed to transfer stocks');
    } finally {
      setTransferLoading(null);
    }
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry =>
    entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.gst_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle export to Excel
  const handleExportExcel = () => {
    try {
      setExportLoading(true);
      const exportData = filteredEntries.map(entry => {
        const baseEntry = {
          'Supplier': entry.supplier,
          'GST No': entry.gst_no,
          'State': entry.state || 'Tamil Nadu',
          'Address': entry.address,
          'Contact': entry.contact || 'N/A',
          'Email': entry.email || 'N/A',
          'Bill No': entry.bill_no,
          'Purchase Date': new Date(entry.purchase_date).toLocaleDateString(),
          'Gross Amount': entry.gross_amount?.toFixed(2) || '0.00',
          'Discount': entry.discount?.toFixed(2) || '0.00',
          'Additional Charges': entry.add_charges?.toFixed(2) || '0.00',
          'Net Amount': entry.net_amount?.toFixed(2) || '0.00',
          'Round Off': entry.round_off_amount?.toFixed(2) || '0.00',
          'Status': entry.invoice_type === 'Transferred_Inventory' ? 'Transferred' : 'Pending',
        };

        if (!entry.products || entry.products.length === 0) {
          return [baseEntry];
        }

        return entry.products.map(product => ({
          ...baseEntry,
          'Product Name': product.name,
          'Category': product.product_category || 'N/A',
          'Stock': product.stock || 'N/A',
          'Unit Type': product.unitType || 'N/A',
          'MRP': product.mrp?.toFixed(2) || '0.00',
          'Stock Price': product.StockPrice?.toFixed(2) || '0.00',
          'Selling Price': product.price?.toFixed(2) || '0.00',
        }));
      }).flat();

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Inventory');
      XLSX.writeFile(workbook, 'Purchase_Inventory_Report.xlsx');
      toast.success('Excel file exported successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel file');
    } finally {
      setExportLoading(false);
    }
  };

  // Handle download invoice as PDF
  const handleDownloadInvoice = (entry) => {
    try {
      // Import jsPDF and autoTable
      import('jspdf').then(({ jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          // Create a new PDF document
          const doc = new jsPDF();
          
          // Add company logo or header
          doc.setFontSize(20);
          doc.setTextColor(40, 40, 40);
          doc.text("PURCHASE INVOICE", 105, 15, { align: 'center' });
          
          // Add invoice details
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          
          // Supplier details - left side
          doc.text("Supplier:", 14, 30);
          doc.setFont("helvetica", 'bold');
          doc.text(entry.supplier || 'N/A', 40, 30);
          doc.setFont("helvetica", 'normal');
          
          doc.text("GST No:", 14, 35);
          doc.text(entry.gst_no || 'N/A', 40, 35);
          
          doc.text("Address:", 14, 40);
          doc.text(entry.address || 'N/A', 40, 40);
          
          doc.text("City:", 14, 45);
          doc.text(entry.city || 'N/A', 40, 45);
          
          doc.text("State:", 14, 50);
          doc.text(entry.state || 'Tamil Nadu', 40, 50);
          
          doc.text("Contact:", 14, 55);
          doc.text(entry.contact || 'N/A', 40, 55);
          
          // Invoice details - right side
          doc.text("Invoice No:", 120, 30);
          doc.setFont("helvetica", 'bold');
          doc.text(entry.bill_no || 'N/A', 150, 30);
          doc.setFont("helvetica", 'normal');
          
          doc.text("Date:", 120, 35);
          doc.text(new Date(entry.purchase_date).toLocaleDateString(), 150, 35);
          
          doc.text("Payment Mode:", 120, 40);
          doc.text(entry.payment_mode || 'N/A', 150, 40);
          
          doc.text("Payment Status:", 120, 45);
          doc.text(entry.payment_status || 'N/A', 150, 45);
          
          // Add a line
          doc.setDrawColor(200, 200, 200);
          doc.line(14, 65, 196, 65);
          
          // Add products table
          const tableColumn = ["Product", "Category", "Qty", "Unit", "MRP", "Stock Price", "Selling Price", "Total"];
          const tableRows = [];
          
          // Add product rows
          entry.products.forEach(product => {
            const productData = [
              product.name || 'N/A',
              product.product_category || 'N/A',
              product.stock || '0',
              product.unitType || 'N/A',
              `${product.mrp?.toFixed(2) || '0.00'}`,
              `${product.StockPrice?.toFixed(2) || '0.00'}`,
              `${product.price?.toFixed(2) || '0.00'}`,
              `${(product.price * product.stock)?.toFixed(2) || '0.00'}`
            ];
            tableRows.push(productData);
          });
          
          // Add the table using autoTable
          autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 66, 66] }
          });
          
          // Get the final y position after the table
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          
          // Add summary
          doc.text("Summary", 14, finalY);
          doc.line(14, finalY + 2, 50, finalY + 2);
          
          doc.text("Gross Amount:", 120, finalY + 10);
          doc.text(`${entry.gross_amount?.toFixed(2) || '0.00'}`, 170, finalY + 10, { align: 'right' });
          
          doc.text("Discount:", 120, finalY + 15);
          doc.text(`${entry.discount?.toFixed(2) || '0.00'}`, 170, finalY + 15, { align: 'right' });
          
          doc.text("Additional Charges:", 120, finalY + 20);
          doc.text(`${entry.add_charges?.toFixed(2) || '0.00'}`, 170, finalY + 20, { align: 'right' });
          
          doc.text("Round Off:", 120, finalY + 25);
          doc.text(`${entry.round_off_amount?.toFixed(2) || '0.00'}`, 170, finalY + 25, { align: 'right' });
          
          doc.setDrawColor(100, 100, 100);
          doc.line(120, finalY + 27, 170, finalY + 27);
          
          doc.setFont("helvetica", 'bold');
          doc.text("Net Amount:", 120, finalY + 32);
          doc.text(`${entry.net_amount?.toFixed(2) || '0.00'}`, 170, finalY + 32, { align: 'right' });
          doc.setFont("helvetica", 'normal');
          
          // Add footer
          doc.setFontSize(8);
          doc.text("This is a computer generated invoice", 105, 280, { align: 'center' });
          
          // Save the PDF
          doc.save(`${entry.supplier.replace(/\s+/g, '_')}_Invoice_${entry.bill_no || 'Unknown'}.pdf`);
          
          toast.success('Invoice PDF downloaded successfully');
        });
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download invoice PDF');
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchEntries();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Package className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Purchase Inventory
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage and track your purchase entries
            </p>
          </div>
  
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
              />
            </div>
  
            {/* Export to Excel Button */}
            <button
              onClick={handleExportExcel}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {exportLoading ? 'Exporting...' : 'Export Excel'}
            </button>
  
            {/* Refresh Button */}
            <button
              onClick={fetchEntries}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
  
        {/* Entries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntries.map(entry => (
            <motion.div
              key={entry.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    {entry.supplier}
                  </h3>
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      GST No: {entry.gst_no}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      shop_id: {entry.shop_id}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(entry.purchase_date).toLocaleDateString()}
                    </p>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      ₹{entry.net_amount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
  
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <button
                  onClick={() => handleViewDetails(entry)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </button>
  
                <button
                  onClick={() => handleStockTransfer(entry.id)}
                  disabled={entry.invoice_type === 'Transferred_Inventory' || transferLoading === entry.id}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${entry.invoice_type === 'Transferred_Inventory'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : transferLoading === entry.id
                        ? 'bg-indigo-500 text-white cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                  {transferLoading === entry.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                  {entry.invoice_type === 'Transferred_Inventory'
                    ? 'Transferred'
                    : transferLoading === entry.id
                      ? 'Transferring...'
                      : 'Transfer'
                  }
                </button>
              </div>
            </motion.div>
          ))}
        </div>
  
        {/* Empty State */}
        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No entries found matching your search.</p>
          </div>
        )}
  
        {/* Details Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {modalLoading ? (
                <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">Loading supplier details...</p>
                </div>
              ) : selectedEntry ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                      Purchase Details
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadInvoice(selectedEntry)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <FileDown className="h-4 w-4" />
                        Download Invoice
                      </button>
                      <button
                        onClick={() => {
                          try {
                            setExportLoading(true);
                            const entry = selectedEntry;
                            let exportData = [];
  
                            // Add invoice details as the first row
                            exportData.push({
                              'Supplier': entry.supplier,
                              'GST No': entry.gst_no,
                              'State': entry.state || 'Tamil Nadu',
                              'Address': entry.address,
                              'City': entry.city || 'N/A',
                              'Pincode': entry.pincode || 'N/A',
                              'Contact Person': entry.contact_person || 'N/A',
                              'Contact': entry.contact || 'N/A',
                              'Email': entry.email || 'N/A',
                              'Bill No': entry.bill_no,
                              'Purchase Date': new Date(entry.purchase_date).toLocaleDateString(),
                              'Payment Status': entry.payment_status || 'N/A',
                              'Payment Mode': entry.payment_mode || 'N/A',
                              'Paid Amount': entry.paid_amount?.toFixed(2) || '0.00',
                              'Balance Amount': entry.balance_amount?.toFixed(2) || '0.00',
                              'Credit Days': entry.credit_days || '0',
                              'Due Date': entry.due_date ? new Date(entry.due_date).toLocaleDateString() : 'N/A',
                              'Gross Amount': entry.gross_amount?.toFixed(2) || '0.00',
                              'Discount': entry.discount?.toFixed(2) || '0.00',
                              'Additional Charges': entry.add_charges?.toFixed(2) || '0.00',
                              'Net Amount': entry.net_amount?.toFixed(2) || '0.00',
                              'Round Off': entry.round_off_amount?.toFixed(2) || '0.00',
                              'Status': entry.invoice_type === 'Transferred_Inventory' ? 'Transferred' : 'Pending',
                              'Product Name': '',
                              'Category': '',
                              'Stock': '',
                              'Unit Type': '',
                              'MRP': '',
                              'Stock Price': '',
                              'Selling Price': ''
                            });
  
                            // Add a separator row
                            exportData.push({
                              'Supplier': '--- Products ---',
                              'GST No': '',
                              'State': '',
                              'Address': '',
                              'City': '',
                              'Pincode': '',
                              'Contact Person': '',
                              'Contact': '',
                              'Email': '',
                              'Bill No': '',
                              'Purchase Date': '',
                              'Payment Status': '',
                              'Payment Mode': '',
                              'Paid Amount': '',
                              'Balance Amount': '',
                              'Credit Days': '',
                              'Due Date': '',
                              'Gross Amount': '',
                              'Discount': '',
                              'Additional Charges': '',
                              'Net Amount': '',
                              'Round Off': '',
                              'Status': '',
                              'Product Name': 'Product Name',
                              'Category': 'Category',
                              'Stock': 'Stock',
                              'Unit Type': 'Unit Type',
                              'MRP': 'MRP',
                              'Stock Price': 'Stock Price',
                              'Selling Price': 'Selling Price'
                            });
  
                            // Add product rows
                            entry.products.forEach(product => {
                              exportData.push({
                                'Supplier': '',
                                'GST No': '',
                                'State': '',
                                'Address': '',
                                'Bill No': '',
                                'Purchase Date': '',
                                'Gross Amount': '',
                                'Discount': '',
                                'Additional Charges': '',
                                'Net Amount': '',
                                'Round Off': '',
                                'Status': '',
                                'Product Name': product.name,
                                'Category': product.product_category || 'N/A',
                                'Stock': product.stock || 'N/A',
                                'Unit Type': product.unitType || 'N/A',
                                'MRP': product.mrp?.toFixed(2) || '0.00',
                                'Stock Price': product.StockPrice?.toFixed(2) || '0.00',
                                'Selling Price': product.price?.toFixed(2) || '0.00'
                              });
                            });
  
                            // Create worksheet with all data in a single sheet
                            const worksheet = XLSX.utils.json_to_sheet(exportData);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, worksheet, 'Purchase Details');
                            XLSX.writeFile(workbook, `${entry.supplier.replace(/\s+/g, '_')}_Purchase_Details.xlsx`);
                            toast.success('Excel file exported successfully');
                          } catch (error) {
                            console.error('Error exporting to Excel:', error);
                            toast.error('Failed to export Excel file');
                          } finally {
                            setExportLoading(false);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        Export Excel
                      </button>
  
                      <button
                        onClick={closeModal}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                      >
                        <X className="h-5 w-5 text-slate-500" />
                      </button>
                    </div>
                  </div>
  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Supplier</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.supplier}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">GST.NO</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.gst_no}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">State</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.state || 'Tamil Nadu'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">City</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.city || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Pincode</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.pincode || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Contact Person</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.contact_person || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Contact</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.contact || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Bill No</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.bill_no}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Purchase Date</p>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          {new Date(selectedEntry.purchase_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
  
                    {/* Financial Details */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        Financial Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Gross Amount</p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            ₹{selectedEntry.gross_amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Discount</p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            ₹{selectedEntry.discount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Additional Charges</p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            ₹{selectedEntry.add_charges?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Net Amount</p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            ₹{selectedEntry.net_amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Round Off</p>
                          <p className="text-slate-800 dark:text-slate-200 font-medium">
                            ₹{selectedEntry.round_off_amount?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
  
                    {/* Product Table */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        Products
                      </h3>
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-700/50">
                              <th className="text-left py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Name</th>
                              <th className="text-left py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Category</th>
                              <th className="text-left py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Stock</th>
                              <th className="text-left py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Unit Type</th>
                              <th className="text-right py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">MRP</th>
                              <th className="text-right py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Stock Price</th>
                              <th className="text-right py-2 px-4 text-sm font-medium text-slate-600 dark:text-slate-400">Selling Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEntry.products.map((product, index) => (
                              <tr key={index} className="border-t border-slate-200 dark:border-slate-700">
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200">{product.name}</td>
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200">{product.product_category || 'N/A'}</td>
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200">{product.stock || 'N/A'}</td>
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200">{product.unitType || 'N/A'}</td>
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200 text-right">
                                  ₹{product.mrp?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200 text-right">
                                  ₹{product.StockPrice?.toFixed(2) || '0.00'}
                                </td>
                                <td className="py-2 px-4 text-sm text-slate-800 dark:text-slate-200 text-right">
                                  ₹{product.price?.toFixed(2) || '0.00'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
  };