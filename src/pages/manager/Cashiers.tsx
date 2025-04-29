
import React, { useState, useEffect } from "react";
import {
  User, 
  UserPlus,
  Search, 
  Trash2,
  Edit
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

interface CashierProfile {
  id: string;
  name: string | null;
  email?: string;
}

const Cashiers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cashiers, setCashiers] = useState<CashierProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<CashierProfile | null>(null);
  const { profile } = useAuth();
  
  const createForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: ""
    }
  });
  
  const editForm = useForm({
    defaultValues: {
      name: ""
    }
  });

  const fetchCashiers = async () => {
    if (!profile?.shop_id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // First get all cashier profiles for this shop
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'cashier')
        .eq('shop_id', profile.shop_id);
      
      if (error) throw error;
      
      // For each cashier, get their email from auth.users
      const cashiersWithEmails = await Promise.all((data || []).map(async (cashier) => {
        // We can't directly query auth.users, so we'll use the sessions table
        const { data: userData, error: userError } = await supabase
          .from('sessions') // Or another public table that might have user emails
          .select('user_email')
          .eq('user_id', cashier.id)
          .limit(1);
        
        return {
          ...cashier,
          email: userData && userData.length > 0 ? userData[0].user_email : undefined
        };
      }));
      
      setCashiers(cashiersWithEmails);
    } catch (error) {
      console.error('Error fetching cashiers:', error);
      toast.error('Failed to fetch cashiers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashiers();
  }, [profile?.shop_id]);

  const handleCreateCashier = async (values: any) => {
    if (!profile?.shop_id) {
      toast.error('You must be assigned to a shop to create cashiers');
      return;
    }
    
    try {
      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name
          }
        }
      });

      if (error) {
        throw error;
      }
      
      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      const userId = data.user.id;
      
      // Update the profile with role and shop assignment
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: "cashier",
          shop_id: profile.shop_id
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success('Cashier created successfully');
      createForm.reset();
      setIsCreateDialogOpen(false);
      
      // Refresh the cashier list
      fetchCashiers();
      
    } catch (error: any) {
      console.error('Error creating cashier:', error);
      toast.error(error.message || 'Failed to create cashier');
    }
  };

  const handleEditCashier = async (values: any) => {
    if (!selectedCashier) return;
    
    try {
      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: values.name
        })
        .eq('id', selectedCashier.id);
      
      if (profileError) throw profileError;
      
      toast.success('Cashier updated successfully');
      editForm.reset();
      setIsEditDialogOpen(false);
      setSelectedCashier(null);
      
      // Refresh the cashier list
      fetchCashiers();
      
    } catch (error: any) {
      console.error('Error updating cashier:', error);
      toast.error(error.message || 'Failed to update cashier');
    }
  };

  const handleDeleteCashier = async (cashierId: string) => {
    if (window.confirm('Are you sure you want to delete this cashier?')) {
      try {
        // Delete the user from auth
        const { error } = await supabase.auth.admin.deleteUser(cashierId);
        
        if (error) {
          // Fallback to just removing from this shop
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ shop_id: null })
            .eq('id', cashierId);
            
          if (profileError) throw profileError;
          toast.success('Cashier removed from shop');
        } else {
          toast.success('Cashier deleted successfully');
        }
        
        fetchCashiers();
      } catch (error: any) {
        console.error('Error deleting cashier:', error);
        toast.error(error.message || 'Failed to delete cashier');
      }
    }
  };

  const handleEditClick = (cashier: CashierProfile) => {
    setSelectedCashier(cashier);
    editForm.reset({
      name: cashier.name || ''
    });
    setIsEditDialogOpen(true);
  };

  // Filter cashiers based on search term
  const filteredCashiers = searchTerm 
    ? cashiers.filter(cashier => 
        (cashier.name && cashier.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cashier.email && cashier.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : cashiers;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Cashiers</h2>
        <p className="text-muted-foreground">
          Manage cashiers for your shop
        </p>
      </div>

      {/* Cashier Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Manage Cashiers</CardTitle>
            <CardDescription>
              Create, edit and manage cashier accounts
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Cashier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Cashier</DialogTitle>
                <DialogDescription>
                  Add a new cashier to your shop.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateCashier)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Email address" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Set password" 
                              {...field} 
                              required
                              minLength={6}
                            />
                          </FormControl>
                          <button 
                            type="button" 
                            className="absolute right-2 top-2.5 text-muted-foreground text-xs"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? "HIDE" : "SHOW"}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className="w-full sm:w-auto">Create Cashier</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Cashier Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Cashier</DialogTitle>
                <DialogDescription>
                  Update cashier details.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditCashier)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cashiers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading cashiers...</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCashiers.map((cashier) => (
                <Card key={cashier.id} className="overflow-hidden">
                  <div className="h-1 w-full bg-primary"></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base">{cashier.name || "Unnamed Cashier"}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {cashier.email && (
                      <div className="text-sm mb-2 text-muted-foreground">
                        {cashier.email}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 pt-3">
                    <div className="flex justify-between w-full">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(cashier)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteCashier(cashier.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredCashiers.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <User className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No cashiers found</h3>
                  <p className="text-sm text-muted-foreground">
                    {cashiers.length === 0 
                      ? "No cashiers have been added to your shop yet. Get started by adding a cashier." 
                      : "No cashiers match your search criteria. Try adjusting your search."}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Cashiers;
