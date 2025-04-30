import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle, Plus, Search, Trash2, User, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Cashier {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

const Cashiers = () => {
  const { profile } = useAuth();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [newCashier, setNewCashier] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchCashiers();
    }
  }, [profile?.shop_id]);

  const fetchCashiers = async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .eq('role', 'cashier')
        .order('name');
      
      if (error) throw error;
      
      setCashiers(data || []);
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      toast.error('Failed to load cashiers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashier = async () => {
    if (!profile?.shop_id) {
      toast.error('Shop ID is required');
      return;
    }

    if (!newCashier.name || !newCashier.email || !newCashier.password) {
      toast.error('All fields are required');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newCashier.email,
        password: newCashier.password,
      });

      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }

      // 2. Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: newCashier.name,
          role: 'cashier',
          shop_id: profile.shop_id
        });

      if (profileError) throw profileError;
      
      toast.success('Cashier added successfully');
      setIsAddDialogOpen(false);
      setNewCashier({ name: "", email: "", password: "" });
      fetchCashiers();
    } catch (error: any) {
      console.error('Error adding cashier:', error);
      toast.error(error.message || 'Failed to add cashier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCashier = async () => {
    if (!selectedCashier) return;
    
    setIsSubmitting(true);
    try {
      // 1. Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedCashier.id);
      
      if (profileError) throw profileError;
      
      // 2. Delete auth user (requires admin privileges)
      // Note: In a real app, you might want to use a server function for this
      // or just deactivate the user instead of deleting
      
      toast.success('Cashier removed successfully');
      setIsDeleteDialogOpen(false);
      setSelectedCashier(null);
      fetchCashiers();
    } catch (error: any) {
      console.error('Error deleting cashier:', error);
      toast.error(error.message || 'Failed to delete cashier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCashiers = cashiers.filter(cashier => 
    cashier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cashier.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cashiers</h2>
        <p className="text-muted-foreground">
          Manage cashiers for your shop
        </p>
      </div>

      {!profile?.shop_id && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cashiers</CardTitle>
            <CardDescription>
              Manage your shop's cashiers
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cashier
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cashiers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="py-3 px-4 text-left font-medium">Name</th>
                  <th className="py-3 px-4 text-left font-medium">Email</th>
                  <th className="py-3 px-4 text-left font-medium">Added On</th>
                  <th className="py-3 px-4 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center">
                      Loading cashiers...
                    </td>
                  </tr>
                ) : filteredCashiers.length > 0 ? (
                  filteredCashiers.map((cashier) => (
                    <tr key={cashier.id} className="border-b">
                      <td className="py-3 px-4">{cashier.name}</td>
                      <td className="py-3 px-4">{cashier.email}</td>
                      <td className="py-3 px-4">{formatDate(cashier.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCashier(cashier);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No cashiers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Cashier Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Cashier</DialogTitle>
            <DialogDescription>
              Create a new cashier account for your shop
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newCashier.name}
                onChange={(e) => setNewCashier({...newCashier, name: e.target.value})}
                placeholder="Enter cashier's name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newCashier.email}
                onChange={(e) => setNewCashier({...newCashier, email: e.target.value})}
                placeholder="Enter cashier's email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={newCashier.password}
                onChange={(e) => setNewCashier({...newCashier, password: e.target.value})}
                placeholder="Create a password"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCashier} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Cashier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this cashier? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCashier && (
            <div className="py-4">
              <div className="flex items-center space-x-4">
                <div className="bg-muted rounded-full p-2">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{selectedCashier.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCashier.email}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCashier} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Cashier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cashiers;
