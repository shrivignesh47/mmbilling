
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Cashier {
  id: string;
  name: string;
  email: string;
  role: string;
}

const Cashiers = () => {
  const { profile } = useAuth();
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCashierDialog, setShowAddCashierDialog] = useState(false);
  const [newCashierEmail, setNewCashierEmail] = useState("");
  const [newCashierName, setNewCashierName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.shop_id) {
      fetchCashiers();
    }
  }, [profile?.shop_id]);

  const fetchCashiers = async () => {
    if (!profile?.shop_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch cashiers for this shop
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shop_id', profile.shop_id)
        .eq('role', 'cashier');
      
      if (error) throw error;
      
      if (data) {
        const formattedCashiers: Cashier[] = data.map(cashier => ({
          id: cashier.id,
          name: cashier.name || 'Unnamed Cashier',
          email: cashier.email || 'No email',
          role: cashier.role
        }));
        
        setCashiers(formattedCashiers);
      }
    } catch (err: any) {
      console.error('Error fetching cashiers:', err);
      setError('Failed to load cashiers. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.shop_id) {
      toast.error('No shop assigned to you');
      return;
    }
    
    if (!newCashierEmail || !newCashierName) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Check if the user with that email already exists
      const { data: existingUsers, error: existingError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', newCashierEmail);
      
      if (existingError) throw existingError;
      
      if (existingUsers && existingUsers.length > 0) {
        toast.error('A user with that email already exists');
        return;
      }
      
      // Create a new auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newCashierEmail,
        password: 'temporary-password-' + Math.random().toString(36).substring(2, 10),
        options: {
          data: {
            name: newCashierName,
            role: 'cashier'
          }
        }
      });
      
      if (authError) throw authError;
      
      if (!authData.user) {
        throw new Error('Failed to create user');
      }
      
      // Update the profile with shop_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          shop_id: profile.shop_id, 
          name: newCashierName,
          email: newCashierEmail 
        })
        .eq('id', authData.user.id);
      
      if (profileError) throw profileError;
      
      toast.success('Cashier added successfully');
      setNewCashierEmail("");
      setNewCashierName("");
      setShowAddCashierDialog(false);
      
      // Refresh cashiers list
      fetchCashiers();
    } catch (err: any) {
      console.error('Error adding cashier:', err);
      setError('Failed to add cashier. ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCashier = async (cashierId: string) => {
    if (!confirm('Are you sure you want to remove this cashier?')) return;
    
    try {
      // Just remove the cashier's association with the shop, don't delete the user
      const { error } = await supabase
        .from('profiles')
        .update({ 
          shop_id: null
        })
        .eq('id', cashierId);
      
      if (error) throw error;
      
      toast.success('Cashier removed successfully');
      
      // Refresh cashiers list
      fetchCashiers();
    } catch (err: any) {
      console.error('Error removing cashier:', err);
      toast.error('Failed to remove cashier: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cashiers</h2>
          <p className="text-muted-foreground">
            Manage cashiers for your shop
          </p>
        </div>
        
        {profile?.shop_id && (
          <Dialog open={showAddCashierDialog} onOpenChange={setShowAddCashierDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Cashier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Cashier</DialogTitle>
                <DialogDescription>
                  Add a new cashier to your shop. They will receive an email with login instructions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCashier}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cashierName">Name</Label>
                    <Input
                      id="cashierName"
                      value={newCashierName}
                      onChange={(e) => setNewCashierName(e.target.value)}
                      placeholder="Enter cashier name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cashierEmail">Email</Label>
                    <Input
                      id="cashierEmail"
                      type="email"
                      value={newCashierEmail}
                      onChange={(e) => setNewCashierEmail(e.target.value)}
                      placeholder="Enter cashier email"
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddCashierDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Cashier'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {!profile?.shop_id && (
        <Alert>
          <AlertDescription>
            You haven't been assigned to a shop yet. Please contact the owner to assign you to a shop.
          </AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!error && cashiers.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground mb-6">No cashiers found for your shop.</p>
                <Button onClick={() => setShowAddCashierDialog(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Your First Cashier
                </Button>
              </CardContent>
            </Card>
          )}
          
          {cashiers.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {cashiers.map((cashier) => (
                <Card key={cashier.id}>
                  <CardHeader>
                    <CardTitle>{cashier.name}</CardTitle>
                    <CardDescription>Cashier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{cashier.email}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveCashier(cashier.id)}
                    >
                      Remove from Shop
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Cashiers;
