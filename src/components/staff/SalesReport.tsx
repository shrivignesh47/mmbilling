import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Search,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const SalesReport: React.FC = () => {
  const [productSales, setProductSales] = useState<{ [productId: string]: { quantity: number; totalPrice: number; profit: number; loss: number } }>({});
  const [productNames, setProductNames] = useState<{ [productId: string]: string }>({});
  const [highSellingProduct, setHighSellingProduct] = useState<string | null>(null);
  const [lowSellingProduct, setLowSellingProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'monthly' | 'yearly' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Calculate totals
  const totalRevenue = Object.values(productSales).reduce((sum, { totalPrice }) => sum + totalPrice, 0);
  const totalQuantity = Object.values(productSales).reduce((sum, { quantity }) => sum + quantity, 0);
  const totalProfit = Object.values(productSales).reduce((sum, { profit }) => sum + profit, 0);
  const totalLoss = Object.values(productSales).reduce((sum, { loss }) => sum + loss, 0);

  // Fetch sales data from Supabase
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        let query = supabase.from('transactions').select('items, created_at');

        if (filterType === 'monthly') {
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          query = query.gte('created_at', startOfMonth.toISOString()).lte('created_at', endOfMonth.toISOString());
        } else if (filterType === 'yearly') {
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          const endOfYear = new Date(now.getFullYear(), 11, 31);
          query = query.gte('created_at', startOfYear.toISOString()).lte('created_at', endOfYear.toISOString());
        } else if (filterType === 'custom' && startDate && endDate) {
          query = query.gte('created_at', new Date(startDate).toISOString()).lte('created_at', new Date(endDate).toISOString());
        }

        const { data: transactions, error: transactionsError } = await query;
        if (transactionsError) throw transactionsError;

        const { data: products, error: productsError } = await supabase.from('products').select('id, name, StockPrice, price');
        if (productsError) throw productsError;

        const productMap = products.reduce((acc, product) => {
          acc[product.id] = {
            name: product.name,
            sellingPrice: product.price || 0,
            stockPrice: product.StockPrice || 0
          };
          return acc;
        }, {} as Record<string, { name: string; sellingPrice: number; stockPrice: number }>);

        const salesData = transactions.reduce((acc, transaction) => {
          if (Array.isArray(transaction.items)) {
            transaction.items.forEach(item => {
              const productId = item.productId || item.product_id;
              const quantity = item.quantity || 0;
              const product = productMap[productId];
              if (!product) return;

              const revenue = product.sellingPrice * quantity;
              const itemProfit = (product.sellingPrice - product.stockPrice) * quantity;

              if (!acc[productId]) {
                acc[productId] = {
                  quantity: 0,
                  totalPrice: 0,
                  profit: 0,
                  loss: 0
                };
              }

              acc[productId].quantity += quantity;
              acc[productId].totalPrice += revenue;

              if (itemProfit > 0) {
                acc[productId].profit += itemProfit;
              } else {
                acc[productId].loss -= itemProfit;
              }
            });
          }
          return acc;
        }, {});

        setProductSales(salesData);

        // Map product names
        const namesData = products.reduce((acc, product) => {
          acc[product.id] = product.name;
          return acc;
        }, {} as { [key: string]: string });

        setProductNames(namesData);

        // Determine top and low selling products
        const sortedProducts = Object.entries(salesData).sort((a, b) => b[1].quantity - a[1].quantity);
        if (sortedProducts.length > 0) {
          setHighSellingProduct(sortedProducts[0][0]);
          setLowSellingProduct(sortedProducts[sortedProducts.length - 1][0]);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [filterType, startDate, endDate]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Export to Excel
  const exportToExcel = () => {
    setExportLoading(true);
    try {
      const exportData = Object.entries(productSales).map(([productId, { quantity, totalPrice, profit, loss }]) => ({
        'Product': productNames[productId],
        'Quantity': quantity,
        'Revenue': totalPrice,
        'Profit': profit,
        'Loss': loss
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Report');
      XLSX.writeFile(workbook, `Sales_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Filtered products based on search term
  const filteredProducts = Object.entries(productSales).filter(([productId]) =>
    productNames[productId]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
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
              <BarChart3 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Sales Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Track your product performance and revenue
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">All Time</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
              <option value="custom">Custom Range</option>
            </select>

            {filterType === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
                <span className="mx-2 text-slate-600 dark:text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </>
            )}

            <button
              onClick={exportToExcel}
              disabled={exportLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:bg-emerald-400"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {exportLoading ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Items Sold</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {totalQuantity.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Top Selling Product</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[180px]">
                  {productNames[highSellingProduct!] || "No data"}
                </p>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Lowest Selling Product</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[180px]">
                  {productNames[lowSellingProduct!] || "No data"}
                </p>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>

          {/* Profit & Loss Cards */}
          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Profit</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {formatCurrency(totalProfit)}
                </p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Loss</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {formatCurrency(totalLoss)}
                </p>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Sales Table */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">Product Sales Report</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-6 text-sm font-semibold text-slate-600 dark:text-slate-400">Product Name</th>
                    <th className="py-3 px-6 text-sm font-semibold text-slate-600 dark:text-slate-400">Quantity</th>
                    <th className="py-3 px-6 text-sm font-semibold text-slate-600 dark:text-slate-400">Revenue</th>
                    <th className="py-3 px-6 text-sm font-semibold text-slate-600 dark:text-slate-400">Profit</th>
                    <th className="py-3 px-6 text-sm font-semibold text-slate-600 dark:text-slate-400">Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(([productId, { quantity, totalPrice, profit, loss }]) => (
                    <motion.tr
                      key={productId}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td className="py-3 px-6 text-sm text-slate-800 dark:text-slate-200">
                        {productNames[productId] || "Unknown"}
                      </td>
                      <td className="py-3 px-6 text-sm text-right text-slate-800 dark:text-slate-200">
                        {quantity.toLocaleString()}
                      </td>
                      <td className="py-3 px-6 text-sm text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalPrice)}
                      </td>
                      <td className="py-3 px-6 text-sm text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(profit)}
                      </td>
                      <td className="py-3 px-6 text-sm text-right font-medium text-red-600 dark:text-red-400">
                        {formatCurrency(loss)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SalesReport;