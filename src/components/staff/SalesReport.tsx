// import React, { useState, useEffect } from "react";
// import { supabase } from "@/integrations/supabase/client";
// import { toast } from "sonner";
// import { Bar, Doughnut, Line } from 'react-chartjs-2';
// import 'chart.js/auto';
// import { motion } from 'framer-motion';

// const SalesReport: React.FC = () => {
//   const [productSales, setProductSales] = useState<{ [productId: string]: { quantity: number, totalPrice: number } }>({});
//   const [productNames, setProductNames] = useState<{ [productId: string]: string }>({});
//   const [highSellingProduct, setHighSellingProduct] = useState<string | null>(null);
//   const [lowSellingProduct, setLowSellingProduct] = useState<string | null>(null);

//   useEffect(() => {
//     fetchProductSales();
//     fetchProductNames();
//   }, []);

//   const fetchProductSales = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("transactions")
//         .select("items");

//       if (error) throw error;

//       const salesData = data.reduce((acc: { [productId: string]: { quantity: number, totalPrice: number } }, transaction) => {
//         if (Array.isArray(transaction.items)) {
//           transaction.items.forEach((item: any) => {
//             const { productId, quantity, price } = item;
//             if (!acc[productId]) {
//               acc[productId] = { quantity: 0, totalPrice: 0 };
//             }
//             acc[productId].quantity += quantity;
//             acc[productId].totalPrice += quantity * price;
//           });
//         }
//         return acc;
//       }, {} as { [productId: string]: { quantity: number, totalPrice: number } });

//       setProductSales(salesData);

//       const entries = Object.entries(salesData);
//       const highSelling = entries.reduce((max, [productId, { quantity }]) => {
//         return quantity > max.quantity ? { productId, quantity } : max;
//       }, { productId: null, quantity: 0 });

//       const lowSelling = entries.reduce((min, [productId, { quantity }]) => {
//         return quantity < min.quantity ? { productId, quantity } : min;
//       }, { productId: null, quantity: Infinity });

//       setHighSellingProduct(highSelling.productId);
//       setLowSellingProduct(lowSelling.productId);
//     } catch (error) {
//       console.error("Error fetching product sales:", error);
//       toast.error("Failed to load product sales data");
//     }
//   };

//   const fetchProductNames = async () => {
//     try {
//       const { data, error } = await supabase
//         .from("products")
//         .select("id, name");

//       if (error) throw error;

//       const namesData = data.reduce((acc, product) => {
//         acc[product.id] = product.name;
//         return acc;
//       }, {});

//       setProductNames(namesData);
//     } catch (error) {
//       console.error("Error fetching product names:", error);
//       toast.error("Failed to load product names");
//     }
//   };

//   const chartData = {
//     labels: Object.keys(productSales).map(productId => productNames[productId] || "Unknown"),
//     datasets: [
//       {
//         label: 'Quantity Sold',
//         data: Object.values(productSales).map(sale => sale.quantity),
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//       },
//       {
//         label: 'Total Price',
//         data: Object.values(productSales).map(sale => sale.totalPrice),
//         backgroundColor: 'rgba(153, 102, 255, 0.6)',
//       }
//     ]
//   };

//   const doughnutData = {
//     labels: Object.keys(productSales).map(productId => productNames[productId] || "Unknown"),
//     datasets: [
//       {
//         data: Object.values(productSales).map(sale => sale.totalPrice),
//         backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
//       }
//     ]
//   };

//   const lineData = {
//     labels: Object.keys(productSales).map(productId => productNames[productId] || "Unknown"),
//     datasets: [
//       {
//         label: 'Sales Trend',
//         data: Object.values(productSales).map(sale => sale.quantity),
//         borderColor: 'rgba(75, 192, 192, 1)',
//         fill: false,
//       }
//     ]
//   };

//   return (
//     <motion.div className="p-5 max-w-full mx-auto bg-white grid grid-cols-1 md:grid-cols-3 gap-6">
//       <motion.h2 className="text-center text-3xl font-bold mb-5 col-span-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//         Sales Dashboard
//       </motion.h2>
//       <motion.div className="flex flex-col items-center mb-5 bg-white p-4 rounded shadow" initial={{ x: -100 }} animate={{ x: 0 }}>
//         <h3 className="text-lg font-semibold text-green-700">Top Selling Product: {productNames[highSellingProduct] || "No data"}</h3>
//         <h3 className="text-lg font-semibold text-orange-700">Low Selling Product: {productNames[lowSellingProduct] || "No data"}</h3>
//       </motion.div>
//       <motion.div className="mb-10 bg-white p-4 rounded shadow" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
//         <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
//       </motion.div>
//       <motion.div className="mb-10 bg-white p-4 rounded shadow" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
//         <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
//       </motion.div>
//       <motion.div className="mb-10 bg-white p-4 rounded shadow" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
//         <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
//       </motion.div>
//       <motion.div className="col-span-full bg-white p-4 rounded shadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//         <h4 className="text-xl font-semibold mb-3">Product Sales Breakdown:</h4>
//         <ul className="list-disc pl-5">
//           {Object.entries(productSales).map(([productId, { quantity, totalPrice }]) => (
//             <li key={productId} className="mb-2">
//               Product Name: {productNames[productId] || "Unknown"}, Quantity Sold: {quantity}, Total Price: ₹{totalPrice.toFixed(2)}
//             </li>
//           ))}
//         </ul>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default SalesReport;


import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Search
} from 'lucide-react';

const SalesReport: React.FC = () => {
  const [productSales, setProductSales] = useState<{ [productId: string]: { quantity: number, totalPrice: number } }>({});
  const [productNames, setProductNames] = useState<{ [productId: string]: string }>({});
  const [highSellingProduct, setHighSellingProduct] = useState<string | null>(null);
  const [lowSellingProduct, setLowSellingProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProductSales(), fetchProductNames()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSales = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('items');

      if (error) throw error;

      const salesData = data.reduce((acc, transaction) => {
        if (Array.isArray(transaction.items)) {
          transaction.items.forEach((item: any) => {
            const { productId, quantity, price } = item;
            if (!acc[productId]) {
              acc[productId] = { quantity: 0, totalPrice: 0 };
            }
            acc[productId].quantity += quantity;
            acc[productId].totalPrice += quantity * price;
          });
        }
        return acc;
      }, {} as { [key: string]: { quantity: number; totalPrice: number } });

      setProductSales(salesData);

      const entries = Object.entries(salesData);
      if (entries.length > 0) {
        const highSelling = entries.reduce((max, [productId, { quantity }]) => {
          return quantity > max.quantity ? { productId, quantity } : max;
        }, { productId: entries[0][0], quantity: entries[0][1].quantity });

        const lowSelling = entries.reduce((min, [productId, { quantity }]) => {
          return quantity < min.quantity ? { productId, quantity } : min;
        }, { productId: entries[0][0], quantity: entries[0][1].quantity });

        setHighSellingProduct(highSelling.productId);
        setLowSellingProduct(lowSelling.productId);
      }
    } catch (error) {
      console.error('Error fetching product sales:', error);
      toast.error('Failed to load product sales data');
    }
  };

  const fetchProductNames = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name');

      if (error) throw error;

      const namesData = Array.isArray(data) ? data.reduce((acc, product) => {
        acc[product.id] = product.name;
        return acc;
      }, {} as { [key: string]: string }) : {};

      setProductNames(namesData);
    } catch (error) {
      console.error('Error fetching product names:', error);
      toast.error('Failed to load product names');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const totalRevenue = Object.values(productSales).reduce((sum, { totalPrice }) => sum + totalPrice, 0);
  const totalQuantity = Object.values(productSales).reduce((sum, { quantity }) => sum + quantity, 0);

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
            <p className="text-slate-600 dark:text-slate-400 mt-1">Track your product performance and revenue</p>
          </div>
          
          <div className="flex items-center gap-4">
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
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <Calendar className="h-4 w-4" />
              This Month
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div 
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{totalQuantity.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Low Selling Product</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[180px]">
                  {productNames[lowSellingProduct!] || "No data"}
                </p>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Product Sales Table */}
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Product Sales Breakdown</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left py-3 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Product Name</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Quantity Sold</th>
                  <th className="text-right py-3 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(([productId, { quantity, totalPrice }]) => (
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
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SalesReport;