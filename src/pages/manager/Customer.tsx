import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  UserCircle
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  transaction_id: string | null;
}

const CustomerDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*');

      if (error) throw error;

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Group customers by phone number
  const groupedByPhone: { [phone: string]: Customer[] } = {};
  customers.forEach((customer) => {
    if (!groupedByPhone[customer.phone]) {
      groupedByPhone[customer.phone] = [];
    }
    groupedByPhone[customer.phone].push(customer);
  });

  // Filtered and grouped customers by phone
  const filteredGroups = Object.values(groupedByPhone)
    .filter(group =>
      group[0].name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group[0].email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group[0].phone.includes(searchTerm)
    );

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
              <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Customer Directory
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage and view customer information
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
              />
            </div>
            <button 
              onClick={fetchCustomers}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Customers</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">{customers.length}</p>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">With Transactions</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {customers.filter(c => c.transaction_id).length}
                </p>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <UserCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
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
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">New Customers</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {customers.filter(c => !c.transaction_id).length}
                </p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <UserCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Customer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group, idx) => {
            const customer = group[0]; // Use the first customer for display info
            const transactions = group
              .filter(c => c.transaction_id)
              .map(c => c.transaction_id);

            return (
              <motion.div
                key={customer.phone}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                      {customer.name}
                    </h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="h-4 w-4 mr-2" />
                        <a href={`mailto:${customer.email}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                          {customer.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${customer.phone}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                          {customer.phone}
                        </a>
                      </div>
                      <div className="flex items-start text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                        <span>{customer.address}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Show all transaction IDs for this phone group */}
                {transactions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Transactions:
                    </p>
                    <ul className="space-y-1">
                      {transactions.map((tid, i) => (
                        <li key={i} className="text-xs text-slate-500 dark:text-slate-400">
                          {tid}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No customers found matching your search.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CustomerDashboard;