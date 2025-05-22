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
  Search
} from 'lucide-react';

export default function PurchaseInventory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockTransferred, setIsStockTransferred] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data: purchaseEntries, error: entryError } = await supabase
        .from('purchase_entry')
        .select('*');

      if (entryError) throw entryError;

      const { data: purchaseProducts, error: productsError } = await supabase
        .from('purchase_entry_products')
        .select('*');

      if (productsError) throw productsError;

      // Use 'purchase_entry_id' to map products to their respective entries
      const combinedData = purchaseEntries.map(entry => ({
         ...entry,
        products: purchaseProducts.filter(product => product.purchase_entry_id === entry.id),
      }));

      setEntries(combinedData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load purchase entries');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (entry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  const handleStockTransfer = async (entryId) => {
    try {
      const { error } = await supabase
        .from('purchase_entry')
        .update({ invoice_type: 'Transferred_Inventory' })
        .eq('id', entryId);

      if (error) throw error;

      setIsStockTransferred(true);
      toast.success('Stocks Transferred to Inventory');
      fetchEntries(); // Refresh the list
    } catch (error) {
      console.error('Error transferring stock:', error);
      toast.error('Failed to transfer stocks');
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.gst_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <button 
              onClick={fetchEntries}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
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
                  disabled={entry.invoice_type === 'Transferred_Inventory'}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors
                    ${entry.invoice_type === 'Transferred_Inventory'
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                  <Truck className="h-4 w-4" />
                  {entry.invoice_type === 'Transferred_Inventory' ? 'Transferred' : 'Transfer'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No entries found matching your search.</p>
          </div>
        )}

        {/* Details Modal */}
        {isModalOpen && selectedEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <motion.div 
              className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                    Purchase Details
                  </h2>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
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
                      <p className="text-slate-800 dark:text-slate-200 font-medium">{selectedEntry.state}</p>
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
                          ₹{selectedEntry.net_amount || '0.00'}
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
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
}