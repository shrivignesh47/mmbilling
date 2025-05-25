import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, X, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

// Define the Supplier interface
// Update the Supplier interface to include payment-related fields
interface Supplier {
  id?: string;
  name: string;
  email: string;
  phone: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  contact_person?: string;
  created_at?: string;
  updated_at?: string;
  is_active: boolean;
  shop_id?: string;
  credit_days?: number; // Default credit period in days
  credit_limit?: number; // Maximum credit amount allowed
  outstanding_balance?: number; // Current outstanding balance
  payment_status?: 'Paid' | 'Unpaid' | 'Partially Paid';
  payment_mode?: string;
  paid_amount?: number;
  balance_amount?: number;
  due_date?: string;
  purchase_date?: string;
  bill_date?: string;
}

// Update the emptySupplier object to include default values for new fields
const emptySupplier: Supplier = {
  name: '',
  email: '',
  phone: '',
  gst_number: '',
  address: '',
  city: '',
  state: '',
  country: 'India', // Default to India
  pincode: '',
  contact_person: '',
  is_active: true,
  credit_days: 30, // Default 30 days
  credit_limit: 0, // Default no limit
  outstanding_balance: 0, // Default no outstanding balance
  payment_status: 'Unpaid',
  payment_mode: 'Cash',
  paid_amount: 0,
  balance_amount: 0,
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  purchase_date: new Date().toISOString().split('T')[0],
  bill_date: new Date().toISOString().split('T')[0],
};

export default function SupplierPage() {
  // State variables
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  // Initial empty supplier form state
  const emptySupplier: Supplier = {
    name: '',
    email: '',
    phone: '',
    gst_number: '',
    address: '',
    city: '',
    state: '',
    country: 'India', // Default to India
    pincode: '',
    contact_person: '',
    is_active: true,
    credit_days: 30, // Default 30 days
    credit_limit: 0, // Default no limit
    outstanding_balance: 0, // Default no outstanding balance
  };
  
  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  // Fetch suppliers from Supabase
  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      // Get shop_id from local storage
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        toast.error('User ID not found');
        setIsLoading(false);
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
        setIsLoading(false);
        return;
      }

      const shop_id = profileData?.shop_id;

      // Fetch suppliers for this shop
      const { data, error } = await supabase
        .from('supplier')
        .select('*')
        .eq('shop_id', shop_id)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching suppliers:', error);
        toast.error('Failed to load suppliers');
      } else {
        setSuppliers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter suppliers based on search term
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm) ||
      supplier.gst_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open form for adding a new supplier
  const handleAddSupplier = () => {
    setCurrentSupplier({ ...emptySupplier });
    setFormMode('add');
    setIsFormOpen(true);
  };

  // Open form for editing an existing supplier
  const handleEditSupplier = (supplier: Supplier) => {
    setCurrentSupplier({ ...supplier });
    setFormMode('edit');
    setIsFormOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (supplier: Supplier) => {
    setCurrentSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Handle checkbox separately with type assertion
    const checked = (e.target as HTMLInputElement).type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : undefined;
    
    if (currentSupplier) {
      if (name === 'credit_days' && currentSupplier.purchase_date) {
        // Calculate new due date based on purchase date and credit days
        const purchaseDate = new Date(currentSupplier.purchase_date);
        const dueDate = new Date(purchaseDate);
        // Convert value to number safely
        const creditDays = parseInt(value) || 0;
        dueDate.setDate(dueDate.getDate() + creditDays);
        
        setCurrentSupplier({
          ...currentSupplier,
          [name]: creditDays, // Store as number
          due_date: dueDate.toISOString().split('T')[0]
        });
      } else if (name === 'purchase_date') {
        // Update due date when purchase date changes
        const newPurchaseDate = new Date(value);
        const dueDate = new Date(newPurchaseDate);
        dueDate.setDate(dueDate.getDate() + (currentSupplier.credit_days || 30));
        
        setCurrentSupplier({
          ...currentSupplier,
          [name]: value,
          due_date: dueDate.toISOString().split('T')[0]
        });
      } else if (name === 'paid_amount' && currentSupplier.outstanding_balance) {
        // Calculate balance amount based on outstanding balance and paid amount
        const paidAmount = parseFloat(value) || 0;
        const outstandingBalance = currentSupplier.outstanding_balance || 0;
        const balanceAmount = outstandingBalance - paidAmount;
        
        // Determine payment status
        let paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid' = 'Unpaid';
        if (balanceAmount <= 0) {
          paymentStatus = 'Paid';
        } else if (paidAmount > 0) {
          paymentStatus = 'Partially Paid';
        }
        
        setCurrentSupplier({
          ...currentSupplier,
          paid_amount: paidAmount,
          balance_amount: balanceAmount > 0 ? balanceAmount : 0,
          payment_status: paymentStatus
        });
      } else {
        // Handle different input types appropriately
        let updatedValue: string | number | boolean;
        
        if (checked !== undefined) {
          // It's a checkbox
          updatedValue = checked;
        } else if ((e.target as HTMLInputElement).type === 'number') {
          // It's a number input
          updatedValue = parseFloat(value) || 0;
        } else {
          // It's a text input or select
          updatedValue = value;
        }
        
        setCurrentSupplier({
          ...currentSupplier,
          [name]: updatedValue
        });
      }
    }
  };

  // Save supplier (create or update)
  const handleSaveSupplier = async () => {
    if (!currentSupplier) return;

    try {
      // Get shop_id
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

      // Validate required fields
      if (!currentSupplier.name || !currentSupplier.phone) {
        toast.error('Name and phone are required fields');
        return;
      }

      // Prepare data with shop_id
      const supplierData = {
        ...currentSupplier,
        shop_id,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (formMode === 'add') {
        // Create new supplier
        supplierData.created_at = new Date().toISOString();
        result = await supabase.from('supplier').insert([supplierData]);
      } else {
        // Update existing supplier
        const { id, ...updateData } = supplierData;
        result = await supabase
          .from('supplier')
          .update(updateData)
          .eq('id', id);
      }

      if (result.error) {
        console.error('Error saving supplier:', result.error);
        toast.error(
          formMode === 'add'
            ? 'Failed to add supplier'
            : 'Failed to update supplier'
        );
      } else {
        toast.success(
          formMode === 'add'
            ? 'Supplier added successfully'
            : 'Supplier updated successfully'
        );
        setIsFormOpen(false);
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Delete supplier
  const handleDeleteSupplier = async () => {
    if (!currentSupplier?.id) return;

    try {
      const { error } = await supabase
        .from('supplier')
        .delete()
        .eq('id', currentSupplier.id);

      if (error) {
        console.error('Error deleting supplier:', error);
        toast.error('Failed to delete supplier');
      } else {
        toast.success('Supplier deleted successfully');
        setIsDeleteDialogOpen(false);
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Toggle supplier active status
  const toggleSupplierStatus = async (supplier: Supplier) => {
    try {
      const { error } = await supabase
        .from('supplier')
        .update({ is_active: !supplier.is_active, updated_at: new Date().toISOString() })
        .eq('id', supplier.id);

      if (error) {
        console.error('Error updating supplier status:', error);
        toast.error('Failed to update supplier status');
      } else {
        toast.success(`Supplier ${supplier.is_active ? 'deactivated' : 'activated'} successfully`);
        fetchSuppliers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    }
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
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Suppliers
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage your supplier information
            </p>
          </div>
          <Button onClick={handleAddSupplier} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" /> Add Supplier
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search suppliers by name, email, phone or GST number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              variant="outline"
              onClick={fetchSuppliers}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="h-8 w-8 mx-auto animate-spin text-indigo-600" />
              <p className="mt-2 text-slate-600 dark:text-slate-400">Loading suppliers...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm
                  ? 'No suppliers match your search criteria'
                  : 'No suppliers found. Add your first supplier!'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>GST Number</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Credit Terms</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">
                        <div>{supplier.name}</div>
                        {supplier.contact_person && (
                          <div className="text-sm text-slate-500">
                            Contact: {supplier.contact_person}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{supplier.phone}</div>
                        {supplier.email && (
                          <div className="text-sm text-slate-500">{supplier.email}</div>
                        )}
                      </TableCell>
                      <TableCell>{supplier.gst_number || '-'}</TableCell>
                      <TableCell>
                        <div>{supplier.city}</div>
                        <div className="text-sm text-slate-500">{supplier.state}</div>
                      </TableCell>
                      <TableCell>
                        <div>Credit: {supplier.credit_days || 30} days</div>
                        <div className="text-sm text-slate-500">
                          {supplier.due_date && (
                            <span>Due: {new Date(supplier.due_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={
                          supplier.payment_status === 'Paid' 
                            ? 'text-green-600' 
                            : supplier.payment_status === 'Partially Paid' 
                              ? 'text-amber-600' 
                              : 'text-red-600'
                        }>
                          {supplier.payment_status || 'Unpaid'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {supplier.balance_amount ? (
                            <span>₹{supplier.balance_amount.toFixed(2)} balance</span>
                          ) : (
                            <span>No balance</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={supplier.is_active}
                            onCheckedChange={() => toggleSupplierStatus(supplier)}
                          />
                          <span
                            className={
                              supplier.is_active
                                ? 'text-green-600 dark:text-green-500'
                                : 'text-red-600 dark:text-red-500'
                            }
                          >
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSupplier(supplier)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(supplier)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </motion.div>

      {/* Supplier Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === 'add' ? 'Add New Supplier' : 'Edit Supplier'}
            </DialogTitle>
            <DialogDescription>
              {formMode === 'add'
                ? 'Add a new supplier to your database'
                : 'Update supplier information'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Supplier Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={currentSupplier?.name || ''}
                onChange={handleInputChange}
                placeholder="Company or individual name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                name="contact_person"
                value={currentSupplier?.contact_person || ''}
                onChange={handleInputChange}
                placeholder="Primary contact name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                value={currentSupplier?.phone || ''}
                onChange={handleInputChange}
                placeholder="Mobile or landline number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={currentSupplier?.email || ''}
                onChange={handleInputChange}
                placeholder="Email address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst_number">GST Number</Label>
              <Input
                id="gst_number"
                name="gst_number"
                value={currentSupplier?.gst_number || ''}
                onChange={handleInputChange}
                placeholder="GSTIN"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={currentSupplier?.address || ''}
                onChange={handleInputChange}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={currentSupplier?.city || ''}
                onChange={handleInputChange}
                placeholder="City"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                value={currentSupplier?.state || ''}
                onChange={handleInputChange}
                placeholder="State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                value={currentSupplier?.country || 'India'}
                onChange={handleInputChange}
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                name="pincode"
                value={currentSupplier?.pincode || ''}
                onChange={handleInputChange}
                placeholder="ZIP/Postal code"
              />
            </div>

            {/* Add Credit and Payment Information Section */}
           

            <div className="space-y-2 md:col-span-2 flex items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  checked={currentSupplier?.is_active || false}
                  onCheckedChange={(checked) =>
                    setCurrentSupplier(
                      currentSupplier
                        ? { ...currentSupplier, is_active: checked }
                        : null
                    )
                  }
                />
                <Label htmlFor="is_active">Active Supplier</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSupplier}>Save Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete supplier "{currentSupplier?.name}"? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSupplier}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Supplier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
