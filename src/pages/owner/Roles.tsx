
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ShieldCheck,
  ShieldX,
  Search,
  Info,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import RoleForm from "@/components/roles/RoleForm";
import { CustomRole } from "@/types/supabase-extensions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define Permission type here to match what's used in RoleForm
interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
}

type SystemRoleType = "owner" | "manager" | "cashier";

const SYSTEM_PERMISSIONS: Permission[] = [
  { id: "1", code: "manage_users", name: "Manage Users", description: "Create, edit, and delete user accounts" },
  { id: "2", code: "manage_inventory", name: "Manage Inventory", description: "Add, update, and remove inventory items" },
  { id: "3", code: "manage_products", name: "Manage Products", description: "Create and edit products" },
  { id: "4", code: "view_reports", name: "View Reports", description: "Access sales and inventory reports" },
  { id: "5", code: "process_sales", name: "Process Sales", description: "Create and complete sales transactions" },
  { id: "6", code: "manage_settings", name: "Manage Settings", description: "Change system and shop settings" },
  { id: "7", code: "view_dashboard", name: "View Dashboard", description: "Access the dashboard and statistics" },
];

const RolesPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);

  // Load roles data
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      setRoles(data as CustomRole[] || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Create a new role
  const handleCreateRole = async (formData: {
    name: string;
    description: string;
    permissions: string[];
  }) => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .insert({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        })
        .select();

      if (error) {
        throw error;
      }

      toast.success('Role created successfully');
      setIsAddDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Failed to create role');
    }
  };

  // Update an existing role
  const handleUpdateRole = async (formData: {
    name: string;
    description: string;
    permissions: string[];
  }) => {
    if (!selectedRole) return;

    try {
      const { error } = await supabase
        .from('custom_roles')
        .update({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        })
        .eq('id', selectedRole.id);

      if (error) {
        throw error;
      }

      toast.success('Role updated successfully');
      setIsEditDialogOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  // Delete a role
  const handleDeleteRole = async (roleId: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this role?');
    if (!confirmDelete) return;

    try {
      // First, check if any users are assigned this role
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', roleId as any);

      if (usersError) throw usersError;

      if (users && users.length > 0) {
        toast.error(`Cannot delete role: ${users.length} users are assigned to this role`);
        return;
      }

      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', roleId);

      if (error) {
        throw error;
      }

      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Failed to delete role');
    }
  };

  // Filter roles based on search term
  const filteredRoles = searchTerm
    ? roles.filter(role =>
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : roles;

  const openEditDialog = (role: CustomRole) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Role Management</h2>
        <p className="text-muted-foreground">
          Create and manage custom roles with specific permissions
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Custom Roles</CardTitle>
            <CardDescription>
              Define roles with specific access permissions
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create New Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              <RoleForm
                availablePermissions={SYSTEM_PERMISSIONS}
                onSubmit={handleCreateRole}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          {/* Search */}
          <div className="mb-6 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border animate-pulse">
                  <CardHeader className="p-4">
                    <div className="h-5 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="h-4 bg-muted rounded w-full mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* System Roles Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">System Roles</h3>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {(["owner", "manager", "cashier"] as SystemRoleType[]).map((role) => (
                    <Card key={role} className="border border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base capitalize">{role}</CardTitle>
                          <Badge variant="outline" className="bg-primary/10">System</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {role === "owner" && "Full access to all system features and settings."}
                          {role === "manager" && "Manage shop inventory, products and cashiers."}
                          {role === "cashier" && "Process sales and view assigned shop products."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {role === "owner" && SYSTEM_PERMISSIONS.map(p => (
                            <Badge key={p.code} variant="secondary" className="text-xs">{p.name}</Badge>
                          ))}
                          {role === "manager" && ["manage_inventory", "manage_products", "view_reports", "process_sales"].map(code => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {SYSTEM_PERMISSIONS.find(p => p.code === code)?.name || code}
                            </Badge>
                          ))}
                          {role === "cashier" && ["process_sales", "view_reports"].map(code => (
                            <Badge key={code} variant="secondary" className="text-xs">
                              {SYSTEM_PERMISSIONS.find(p => p.code === code)?.name || code}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              
              {/* Custom Roles Section */}
              <h3 className="text-lg font-medium mb-4">Custom Roles</h3>
              {filteredRoles.length > 0 ? (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {filteredRoles.map((role) => (
                    <Card key={role.id} className="border">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base">{role.name}</CardTitle>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <Info className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(role)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteRole(role.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {role.description || "No description provided."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map(permission => {
                              const permInfo = SYSTEM_PERMISSIONS.find(p => p.code === permission);
                              return (
                                <TooltipProvider key={permission}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div>
                                        <Badge variant="secondary" className="text-xs">
                                          {permInfo?.name || permission}
                                        </Badge>
                                      </div>
                                    </TooltipTrigger>
                                    {permInfo && (
                                      <TooltipContent>
                                        <p>{permInfo.description}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No custom roles found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm 
                      ? "No roles match your search criteria."
                      : "Get started by creating your first custom role."
                    }
                  </p>
                  {!searchTerm && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="mt-4"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New Role
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <RoleForm
              initialData={{
                id: selectedRole.id,
                name: selectedRole.name,
                description: selectedRole.description || "",
                permissions: selectedRole.permissions || [],
              }}
              availablePermissions={SYSTEM_PERMISSIONS}
              onSubmit={handleUpdateRole}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedRole(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolesPage;
