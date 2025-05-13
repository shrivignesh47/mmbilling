import React, { useState } from "react";
import { Plus, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { CustomRole, UserRole } from "@/types/supabase-extensions";
import { useStaffManagement } from "@/hooks/staff/useStaffManagement";

// Component imports
import StaffStatCards from "@/components/staff/StaffStatCards";
import UsersList from "@/components/staff/UsersList";
import CreateUserForm from "@/components/staff/CreateUserForm";
import EditUserForm from "@/components/staff/EditUserForm";
import CreateRoleForm from "@/components/staff/CreateRoleForm";
import RolesList from "@/components/staff/RolesList";

const UserManagement: React.FC = () => {
  const {
    users,
    roles,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedUser,
    setSelectedUser,
    permissions,
    cashierCount,
    customRoleCount,
    handleCreateUser,
    handleEditUser,
    handleCreateRole,
    handleDeleteUser,
    handleDeleteRole
  } = useStaffManagement();

  const [activeTab, setActiveTab] = useState("users");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  // Forms
  const createForm = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "cashier" as UserRole, // Default to cashier role
      custom_role_id: null, // Added custom_role_id field
      custom_permissions: [] as string[]
    }
  });
  
  const editForm = useForm({
    defaultValues: {
      name: "",
      role: "cashier" as UserRole,
      custom_role_id: null, // Added custom_role_id field
      custom_permissions: [] as string[]
    }
  });

  const roleForm = useForm({
    defaultValues: {
      name: "",
      description: "",
      permissions: [] as string[]
    }
  });

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    editForm.reset({
      name: user.name || '',
      role: user.role as UserRole,
      custom_role_id: user.custom_role_id || null, // Reset custom_role_id
      custom_permissions: user.custom_permissions || []
    });
    setIsEditDialogOpen(true);
  };

  const onCreateUserSubmit = async (values: any) => {
    const roleValue = values.role; // Directly use the selected role
  
    const success = await handleCreateUser({
      ...values,
      role: roleValue, // Ensure this is correctly set
    });
  
    if (success) {
      createForm.reset();
      setIsCreateDialogOpen(false);
    }
  };

  const onEditUserSubmit = async (values: any) => {
    const success = await handleEditUser(values);
    if (success) {
      editForm.reset();
      setIsEditDialogOpen(false);
    }
  };

  const onCreateRoleSubmit = async (values: any) => {
    const success = await handleCreateRole(values);
    if (success) {
      roleForm.reset();
      setIsRoleDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Management</h2>
        <p className="text-muted-foreground">
          Manage staff accounts and roles for your shop
        </p>
      </div>

      {/* Stats */}
      <StaffStatCards 
        totalStaff={users.length} 
        cashierCount={cashierCount} 
        customRolesCount={roles.length} 
      />

      {/* Tabs for Users and Roles management */}
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">Staff Members</TabsTrigger>
          <TabsTrigger value="roles">Custom Roles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
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
                  <CreateUserForm 
                    form={createForm} 
                    permissions={permissions}
                    roles={roles}
                    onSubmit={onCreateUserSubmit}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent>
              <UsersList 
                users={users}
                roles={roles}
                isLoading={isLoading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEditUser={handleEditClick}
                onDeleteUser={handleDeleteUser}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles">
          {/* Role Management */}
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>Custom Roles</CardTitle>
                <CardDescription>
                  Create and manage custom roles with specific permissions
                </CardDescription>
              </div>
              <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Custom Role</DialogTitle>
                    <DialogDescription>
                      Define a new role with specific permissions
                    </DialogDescription>
                  </DialogHeader>
                  <CreateRoleForm 
                    form={roleForm}
                    permissions={permissions}
                    onSubmit={onCreateRoleSubmit}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <RolesList 
                roles={roles}
                isLoading={isLoading}
                onDeleteRole={handleDeleteRole}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff details and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm 
              form={editForm}
              permissions={permissions}
              roles={roles}
              onSubmit={onEditUserSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
