
import React, { useState, useEffect } from "react";
import { 
  Building, 
  Building2, 
  Edit, 
  MoreHorizontal, 
  Package2, 
  Plus, 
  Search, 
  ShoppingBag, 
  Trash2, 
  User 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboards/DashboardCards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

interface Shop {
  id: string;
  name: string;
  address: string | null;
  manager_id: string | null;
  manager_name?: string | null;
  products_count?: number;
  inventory_count?: number;
  is_active: boolean | null;
}

const Shops: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [managers, setManagers] = useState<{id: string, name: string}[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { profile } = useAuth();
  
  const form = useForm({
    defaultValues: {
      name: "",
      address: "",
      manager_id: ""
    }
  });

  const fetchShops = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*');
      
      if (error) {
        throw error;
      }

      // For each shop, if it has a manager_id, fetch the manager's name
      const shopsWithManagers = await Promise.all(data.map(async (shop) => {
        if (shop.manager_id) {
          const { data: managerData, error: managerError } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', shop.manager_id)
            .single();
          
          if (!managerError && managerData) {
            return {
              ...shop,
              manager_name: managerData.name
            };
          }
        }
        return {
          ...shop,
          manager_name: "Unassigned"
        };
      }));

      setShops(shopsWithManagers);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'manager');
      
      if (error) {
        throw error;
      }
      
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to fetch managers');
    }
  };

  useEffect(() => {
    fetchShops();
    fetchManagers();

    // Set up realtime subscription for shops table
    const shopsSubscription = supabase
      .channel('shops-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shops' }, (payload) => {
        fetchShops(); // Refetch when data changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(shopsSubscription);
    };
  }, []);

  const handleCreateShop = async (values: any) => {
    try {
      const { error } = await supabase
        .from('shops')
        .insert({
          name: values.name,
          address: values.address,
          manager_id: values.manager_id || null,
          is_active: true
        });

      if (error) throw error;
      toast.success('Shop created successfully');
      form.reset();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error creating shop:', error);
      toast.error(error.message || 'Failed to create shop');
    }
  };

  const handleDeleteShop = async (shopId: string) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      try {
        const { error } = await supabase
          .from('shops')
          .delete()
          .eq('id', shopId);
        
        if (error) throw error;
        toast.success('Shop deleted successfully');
        fetchShops();
      } catch (error: any) {
        console.error('Error deleting shop:', error);
        toast.error(error.message || 'Failed to delete shop');
      }
    }
  };

  const toggleShopStatus = async (shop: Shop) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ is_active: !shop.is_active })
        .eq('id', shop.id);
      
      if (error) throw error;
      toast.success(`Shop ${!shop.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      console.error('Error updating shop status:', error);
      toast.error(error.message || 'Failed to update shop status');
    }
  };

  // Filter shops based on search term
  const filteredShops = searchTerm 
    ? shops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (shop.address && shop.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (shop.manager_name && shop.manager_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : shops;

  // Shop statistics
  const activeShops = shops.filter(shop => shop.is_active === true).length;
  const inactiveShops = shops.filter(shop => shop.is_active === false || shop.is_active === null).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Shops</h2>
        <p className="text-muted-foreground">
          Manage your shops and locations
        </p>
      </div>

      {/* Shops Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Shops"
          value={shops.length.toString()}
          icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
          description={`${activeShops} active`}
        />
        <StatCard
          title="Active Shops"
          value={activeShops.toString()}
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
          description="Operational shops"
        />
        <StatCard
          title="Inactive Shops"
          value={inactiveShops.toString()}
          icon={<Package2 className="h-4 w-4 text-muted-foreground" />}
          description="Pending or closed shops"
        />
      </div>

      {/* Shop Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Manage Shops</CardTitle>
            <CardDescription>
              Create, edit and manage your shop locations
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Shop
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Shop</DialogTitle>
                <DialogDescription>
                  Add a new shop location to your business.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateShop)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter shop name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Shop address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manager_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Manager (Optional)</FormLabel>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a manager</option>
                          {managers.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.name}
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Shop</Button>
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
              placeholder="Search shops..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading shops...</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShops.map((shop) => (
                <Card key={shop.id} className="overflow-hidden">
                  <div className={`h-1 w-full ${
                    shop.is_active ? "bg-success" : "bg-destructive"
                  }`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{shop.name}</CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Building className="mr-1 h-3 w-3" />
                          {shop.address || "No address provided"}
                        </CardDescription>
                      </div>
                      <Badge variant={shop.is_active ? "default" : "secondary"}>
                        {shop.is_active ? "active" : "inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <div className="flex items-center">
                        <User className="mr-1 h-4 w-4 text-muted-foreground" />
                        <span>Manager:</span>
                      </div>
                      <span className="font-medium">{shop.manager_name || "Unassigned"}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 pt-3">
                    <div className="flex justify-between w-full">
                      <Button size="sm" variant="ghost">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className={shop.is_active ? "text-destructive" : "text-success"}
                          onClick={() => toggleShopStatus(shop)}
                        >
                          {shop.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-destructive"
                          onClick={() => handleDeleteShop(shop.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredShops.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No shops found</h3>
                  <p className="text-sm text-muted-foreground">
                    {shops.length === 0 
                      ? "No shops have been created yet. Get started by adding a shop." 
                      : "No shops match your search criteria. Try adjusting your search."}
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

export default Shops;
