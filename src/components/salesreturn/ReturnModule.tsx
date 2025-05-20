import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, CheckCircle2, XCircle, Search, CreditCard, ArrowLeft } from "lucide-react";

type Product = {
  productId: string;
  name: string;
  unitType: string;
  price: number;
  quantity: number;
};

type Transaction = {
  transaction_id: string;
  date: string;
  customer_name: string;
  items: Product[];
  status: string;
};

type ReturnData = {
  product_id: string;
  product_name: string;
  returned_quantity: number;
  return_reason: string;
  status: string;
};

export const ReturnModule = () => {
  const [transactionId, setTransactionId] = useState("");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnHistory, setReturnHistory] = useState<ReturnData[]>([]); // New state for return history

  const [refundMode, setRefundMode] = useState(false);
  const [returnData, setReturnData] = useState<ReturnData>({
    product_id: "",
    product_name: "",
    returned_quantity: 1,
    return_reason: "",
    status: "pending",
  });

  // Fetch transaction details by ID
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control transaction modal visibility
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false); // State to control refund modal visibility

  // Open the transaction modal when a transaction is searched
  const handleSearch = async () => {
    if (!transactionId.trim()) return;
    setLoading(true);
    setError(null);
    setTransaction(null);
    setRefundMode(false);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('transaction_id, created_at, items')
        .eq('transaction_id', transactionId.trim())
        .single();

      if (error || !data) {
        throw new Error("Transaction not found");
      }

      if (typeof data === 'object' && data !== null && 'transaction_id' in data) {
        setTransaction(data as Transaction);
        await fetchReturnHistory(data.transaction_id);
        setIsModalOpen(true); // Open the transaction modal
      } else {
        throw new Error("Invalid transaction data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all return history
  const fetchReturnHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select('*');

      if (error) {
        throw new Error("Error fetching return history");
      }
      console.log("Return History Data:", data);

      setReturnHistory(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  // Fetch return history on component mount
  useEffect(() => {
    fetchReturnHistory();
  }, []);

  // Refund form handlers
  const handleReturnChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "product_id") {
      const selectedProduct = transaction?.items.find(
        (product) => product.productId === value
      );

      setReturnData((prev) => ({
        ...prev,
        product_id: value,
        product_name: selectedProduct ? selectedProduct.name : "", // Set product_name
      }));
    } else {
      setReturnData((prev) => ({
        ...prev,
        [name]: name === "returned_quantity" ? Number(value) : value,
      }));
    }
  };

  // Submit refund to DB
  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!returnData.product_id) throw new Error("Please select a product");
      if (returnData.returned_quantity < 1) throw new Error("Invalid quantity");

      const { error: insertError } = await supabase.from("returns").insert([
        {
          transaction_id: transaction?.transaction_id,
          product_id: returnData.product_id,
          product_name: returnData.product_name, // Ensure product_name is sent
          returned_quantity: returnData.returned_quantity,
          return_reason: returnData.return_reason,
          status: returnData.status,
          return_date: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      toast.success("Refund processed successfully!");
      setRefundMode(false);
      setReturnData({
        product_id: "",
        product_name: "",
        returned_quantity: 1,
        return_reason: "",
        status: "pending",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error(error ?? "Error processing refund");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Return Dashboard
        </h1>
      </header>

      {/* Search Bar */}
      <div className="flex max-w-lg w-full mb-6 gap-2">
        <input
          type="text"
          placeholder="Enter Transaction ID"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="flex-grow px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Search
        </button>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          className="text-red-700 bg-red-100 p-3 rounded-md mb-4 flex items-center gap-2 max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <XCircle className="w-5 h-5" />
          {error}
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-gray-700 dark:text-gray-300 mb-4 max-w-lg">
          Loading...
        </div>
      )}

      {/* Return History */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Return History
        </h3>
        <table className="w-full table-auto border-collapse border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Product Name</th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Returned Quantity</th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Return Reason</th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Status</th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Return Date</th>
            </tr>
          </thead>
          <tbody>
            {returnHistory.map((returnItem, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{returnItem.product_name}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{returnItem.returned_quantity}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{returnItem.return_reason}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{returnItem.status}</td>
                <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{new Date(returnItem.return_date).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Transaction Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Transaction Details
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsRefundModalOpen(true); // Open the refund modal
                }}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
              >
                <CreditCard className="w-5 h-5" />
                Refund
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <p>
                  <strong>Transaction ID:</strong> {transaction?.transaction_id}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {transaction?.date ? new Date(transaction.date).toLocaleString() : "Invalid Date"}
                </p>
                <p>
                  <strong>Customer:</strong> {transaction?.customer_name}
                </p>
                <p>
                  <strong>Status:</strong> {transaction?.status}
                </p>
              </div>
            </div>

            {/* Products Table */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                Products
              </h3>
              <table className="w-full table-auto border-collapse border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Unit</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Price</th>
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction?.items.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{product.name}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{product.unitType}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{product.price}</td>
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">{product.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Refund Form Modal */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-lg w-full">
            <div className="flex items-center mb-4">
              <button
                onClick={() => setIsRefundModalOpen(false)}
                className="mr-4 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Back to transaction"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </button>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Process Refund
              </h2>
            </div>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Select Product</label>
                <select
                  name="product_id"
                  value={returnData.product_id}
                  onChange={handleReturnChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="">-- Select Product --</option>
                  {transaction?.items.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.name} ({product.quantity} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Returned Quantity</label>
                <input
                  type="number"
                  name="returned_quantity"
                  min={1}
                  max={
                    transaction?.items.find(p => p.productId === returnData.product_id)?.quantity || 1
                  }
                  value={returnData.returned_quantity}
                  onChange={handleReturnChange}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Return Reason</label>
                <textarea
                  name="return_reason"
                  value={returnData.return_reason}
                  onChange={handleReturnChange}
                  rows={3}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Status</label>
                <select
                  name="status"
                  value={returnData.status}
                  onChange={handleReturnChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                >
                  <option value="Pending">Pending</option>
                  <option value="Mistakenly">Mistakenly</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Submit Refund"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
