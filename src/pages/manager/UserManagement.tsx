
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  ShieldCheck,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { CustomRole, UserRole } from "@/types/supabase-extensions";

interface UserProfile {
  id: string;
  name: string | null;
  role: string;
  custom_permissions?: string[];
}

const UserManagement: React.FC = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  // Forms
  const createForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "cashier" as UserRole,
      custom_permissions: [] as string[]
    }
  });
  
  const editForm = useForm({
    defaultValues: {
      name: "",
      role: "cashier" as UserRole,
      custom_permissions: [] as string[]
    }
  });

  // Fetch users related to this manager's shop
  const fetchUsers = async () => {
    if (!profile?.shop_id) return;
    
    setIsLoading(true);
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, custom_permissions')
        .eq('shop_id', profile.shop_id)
        .neq('role', 'manager') // Don't show other managers
        .neq('role', 'owner');  // Don't show owners
      
      if (error) throw error;
      
      // Cast the data to the UserProfile type with proper type handling
      setUsers((data || []) as unknown as UserProfile[]);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available roles
  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*');
      
      if (error) throw error;
      setRoles(data as CustomRole[] || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    
    // Set up realtime subscription for profiles table
    const profilesSubscription = supabase
      .channel('profiles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers(); // Refetch when data changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
    };
  }, [profile?.shop_id]);

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
      
      // Update the profile with role, shop assignment and custom permissions
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: values.role,
          shop_id: profile?.shop_id || null,
          custom_permissions: values.custom_permissions || []
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success('User created successfully');
      createForm.reset();
      setIsCreateDialogOpen(false);
      
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
          role: values.role,
          custom_permissions: values.custom_permissions || []
        })
        .eq('id', selectedUser.id);
      
      if (profileError) throw profileError;
      
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
        // Just delete the profile record, which effectively deactivates the user in our system
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', userId);
            
        if (profileError) throw profileError;
        
        toast.success('User removed successfully');
        fetchUsers();
      } catch (error: any) {
        console.error('Error removing user:', error);
        toast.error(error.message || 'Failed to remove user');
      }
    }
  };

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name || '',
      role: user.role as UserRole,
      custom_permissions: user.custom_permissions || []
    });
    setIsEditDialogOpen(true);
  };

  // Filter users based on search term
  const filteredUsers = searchTerm 
    ? users.filter(user => 
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.role && user.role.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;

  // Get permissions from all roles for the form
  const getAllPermissions = () => {
    const permissionSet = new Set<string>();
    roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissionSet.add(permission);
      });
    });
    return Array.from(permissionSet).map(code => {
      // Map permission codes to display names for selection
      return { 
        code, 
        name: code.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      };
    });
  };

  const cashierCount = users.filter(user => user.role === 'cashier').length;
  const customRoleCount = users.filter(user => user.role !== 'cashier' && user.role !== 'manager').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
        <p className="text-muted-foreground">
          Manage staff accounts and permissions for your shop
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatCard
          title="Total Staff"
          value={users.length.toString()}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="All staff members"
        />
        <StatCard
          title="Cashiers"
          value={cashierCount.toString()}
          icon={<UserCheck className="h-4 w-4 text-muted-foreground" />}
          description="Staff with cashier role"
        />
        <StatCard
          title="Custom Roles"
          value={customRoleCount.toString()}
          icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
          description="Staff with specialized roles"
        />
      </div>

      {/* User Management Section */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Manage Staff</CardTitle>
            <CardDescription>
              Create, edit and manage staff accounts
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Staff Member</DialogTitle>
                <DialogDescription>
                  Add a new staff member to your shop.
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
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="cashier">Cashier</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="custom_permissions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Permissions (Optional)</FormLabel>
                        <div className="border rounded-md p-3 space-y-2">
                          {getAllPermissions().map(permission => (
                            <div key={permission.code} className="flex items-center">
                              <input
                                type="checkbox"
                                id={`create-${permission.code}`}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={field.value?.includes(permission.code)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    field.onChange([...(field.value || []), permission.code]);
                                  } else {
                                    field.onChange(field.value?.filter(p => p !== permission.code));
                                  }
                                }}
                              />
                              <label htmlFor={`create-${permission.code}`} className="ml-2 text-sm">
                                {permission.name}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button type="submit" className="w-full sm:w-auto">Create Staff Member</Button>
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
              placeholder="Search staff members..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p>Loading staff...</p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="overflow-hidden">
                  <div className={`h-1 w-full ${
                    user.role === 'cashier' ? "bg-primary" : "bg-success"
                  }`}></div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{user.name || "Unnamed User"}</CardTitle>
                      </div>
                      <Badge>
                        {user.role === 'cashier' ? 'Cashier' : roles.find(r => r.id === user.role)?.name || user.role}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3">
                    {user.custom_permissions && user.custom_permissions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Custom Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {user.custom_permissions.map(permission => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="border-t bg-muted/50 pt-3">
                    <div className="flex justify-between w-full">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(user)}
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No staff found</h3>
                  <p className="text-sm text-muted-foreground">
                    {users.length === 0 
                      ? "No staff have been added yet. Start by adding your first staff member." 
                      : "No staff match your search criteria. Try adjusting your search."}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog - Fixed by properly nesting inside Dialog component */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
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
                
                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="cashier">Cashier</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="custom_permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Permissions</FormLabel>
                      <div className="border rounded-md p-3 space-y-2">
                        {getAllPermissions().map(permission => (
                          <div key={permission.code} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`edit-${permission.code}`}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              checked={field.value?.includes(permission.code)}
                              onChange={e => {
                                if (e.target.checked) {
                                  field.onChange([...(field.value || []), permission.code]);
                                } else {
                                  field.onChange(field.value?.filter(p => p !== permission.code));
                                }
                              }}
                            />
                            <label htmlFor={`edit-${permission.code}`} className="ml-2 text-sm">
                              {permission.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
