import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Building2,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  id: string;
  name: string | null;
  role: UserRole;
  shop_id: string | null;
  shop_name?: string;
}

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [shops, setShops] = useState<{ id: string, name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  const createForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "manager" as UserRole,
      shop_id: ""
    }
  });
  
  const editForm = useForm({
    defaultValues: {
      name: "",
      role: "manager" as UserRole,
      shop_id: ""
    }
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('role', { ascending: false });
      
      if (error) throw error;
      
      // For users with shop_id, fetch the shop name
      const usersWithShops = await Promise.all((data || []).map(async (user) => {
        if (user.shop_id) {
          const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('name')
            .eq('id', user.shop_id)
            .single();
          
          if (!shopError && shopData) {
            return {
              ...user,
              shop_name: shopData.name
            };
          }
        }
        return user;
      }));
      
      setUsers(usersWithShops);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setShops(data || []);
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error('Failed to fetch shops');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchShops();

    // Set up realtime subscription for profiles table
    const profilesSubscription = supabase
      .channel('profiles-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers(); // Refetch when data changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
    };
  }, []);

  const handleCreateUser = async (values: any) => {
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
          role: "manager",
          shop_id: values.shop_id || null
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success('Manager created successfully');
      createForm.reset();
      setIsCreateDialogOpen(false);
      
      // If assigned to a shop, update the shop's manager_id
      if (values.shop_id) {
        const { error: shopError } = await supabase
          .from('shops')
          .update({ manager_id: userId })
          .eq('id', values.shop_id);
        
        if (shopError) {
          console.error('Error updating shop manager:', shopError);
          toast.error('Manager created but failed to update shop manager');
        }
      }
      
      // Refresh the user list
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleEditUser = async (values: any) => {
    if (!selectedUser) return;
    
    try {
      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: values.name,
          shop_id: values.shop_id || null
        })
        .eq('id', selectedUser.id);
      
      if (profileError) throw profileError;
      
      // If assigned to a shop, update the shop's manager_id
      if (values.shop_id) {
        // First clear any previous manager_id references to this user
        if (selectedUser.shop_id) {
          await supabase
            .from('shops')
            .update({ manager_id: null })
            .eq('manager_id', selectedUser.id);
        }
        
        // Then assign to the new shop
        const { error: shopError } = await supabase
          .from('shops')
          .update({ manager_id: selectedUser.id })
          .eq('id', values.shop_id);
        
        if (shopError) {
          console.error('Error updating shop manager:', shopError);
          toast.error('User updated but failed to update shop manager');
        }
      }
      
      toast.success('User updated successfully');
      editForm.reset();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      
      // Refresh the user list
      fetchUsers();
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // First, clear any shop manager references
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role, shop_id')
          .eq('id', userId)
          .single();
        
        if (profileData && profileData.role === 'manager' && profileData.shop_id) {
          await supabase
            .from('shops')
            .update({ manager_id: null })
            .eq('manager_id', userId);
        }

        // Delete the user from auth
        const { error } = await supabase.auth.admin.deleteUser(userId);
        
        if (error) {
          // Fallback to just deleting the profile if we don't have admin rights
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);
            
          if (profileError) throw profileError;
        }
        
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        toast.error(error.message || 'Failed to delete user');
      }
    }
  };

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name || '',
      role: user.role,
      shop_id: user.shop_id || ''
    });
    setIsEditDialogOpen(true);
  };

  // Filter users based on search term
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.shop_name && user.shop_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  // User statistics
  const ownerCount = users.filter(user => user.role === 'owner').length;
  const managerCount = users.filter(user => user.role === 'manager').length;
  const cashierCount = users.filter(user => user.role === 'cashier').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          Manage system users and their permissions
        </p>
      </div>

      {/* Users Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <StatCard
          title="Total Users"
          value={users.length.toString()}
          icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
          description="All system users"
        />
        <StatCard
          title="Managers"
          value={managerCount.toString()}
          icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
          description="Shop managers"
        />
        <StatCard
          title="Cashiers"
          value={cashierCount.toString()}
          icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />}
          description="Shop cashiers"
        />
      </div>

      {/* User Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Manage Users</CardTitle>
            <CardDescription>
              Create, edit and manage user accounts
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Manager
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Manager</DialogTitle>
                <DialogDescription>
                  Add a new manager to your business.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreateUser)} className="space-y-4">
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
                  <FormField
                    control={createForm.control}
                    name="shop_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Shop (Optional)</FormLabel>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a shop</option>
                          {shops.map((shop) => (
                            <option key={shop.id} value={shop.id}>
                              {shop.name}
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" className="w-full sm:w-auto">Create Manager</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>
                  Update user details and shop assignment.
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditUser)} className="space-y-4">
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
                  {selectedUser?.role === 'manager' && (
                    <FormField
                      control={editForm.control}
                      name="shop_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Shop</FormLabel>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">No shop assigned</option>
                            {shops.map((shop) => (
                              <option key={shop.id} value={shop.id}>
                                {shop.name}
                              </option>
                            ))}
                          </select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
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
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading users...</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <div className={`h-1 w-full ${
                    user.role === 'owner' ? "bg-amber-500" :
                    user.role === 'manager' ? "bg-success" :
                    "bg-primary"
                  }`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{user.name || "Unnamed User"}</CardTitle>
                      </div>
                      <Badge variant={
                        user.role === 'owner' ? "outline" :
                        user.role === 'manager' ? "default" :
                        "secondary"
                      }>
                        {user.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {user.role !== 'owner' && user.shop_id && (
                      <div className="flex justify-between text-sm mb-2">
                        <div className="flex items-center">
                          <Building2 className="mr-1 h-4 w-4 text-muted-foreground" />
                          <span>Shop:</span>
                        </div>
                        <span className="font-medium">{user.shop_name || "Unknown Shop"}</span>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 pt-3">
                    <div className="flex justify-between w-full">
                      {user.role === 'manager' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(user)}
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                      )}
                      
                      {user.role !== 'owner' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive ml-auto"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      )}
                      
                      {user.role === 'owner' && (
                        <div className="w-full text-center text-xs text-muted-foreground italic">
                          System administrator account
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No users found</h3>
                  <p className="text-sm text-muted-foreground">
                    {users.length === 0 
                      ? "No users have been created yet. Get started by adding a user." 
                      : "No users match your search criteria. Try adjusting your search."}
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

export default Users;
