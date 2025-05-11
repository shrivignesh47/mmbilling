
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { UserProfile, Permission, UserRole } from "@/types/staff";
import { CustomRole } from "@/types/supabase-extensions";

export const useStaffManagement = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Fetch users related to this manager's shop
  const fetchUsers = async () => {
    if (!profile?.shop_id) {
      toast.error("You're not assigned to any shop");
      setIsLoading(false);
      return;
    }
    
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
      toast.error('Failed to fetch roles');
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

    // Set up realtime subscription for custom_roles table
    const rolesSubscription = supabase
      .channel('roles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_roles' }, () => {
        fetchRoles(); // Refetch when roles change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSubscription);
      supabase.removeChannel(rolesSubscription);
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
            name: values.name,
            role: values.role, // Keep role as specified in the form
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
          role: values.role, // Use the exact role from the form without type casting
          shop_id: profile?.shop_id || null,
          custom_permissions: values.custom_permissions || []
        })
        .eq('id', userId);
      
      if (profileError) throw profileError;
      
      toast.success('User created successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
      return false;
    }
  };

  const handleEditUser = async (values: any) => {
    if (!selectedUser) return false;
    
    try {
      // Update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          name: values.name,
          role: values.role, // Use the role without type casting
          custom_permissions: values.custom_permissions || []
        })
        .eq('id', selectedUser.id);
      
      if (profileError) throw profileError;
      
      toast.success('User updated successfully');
      setSelectedUser(null);
      return true;
      
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
      return false;
    }
  };

  const handleCreateRole = async (values: any) => {
    try {
      const { error } = await supabase
        .from('custom_roles')
        .insert({
          name: values.name,
          description: values.description,
          permissions: values.permissions
        });
      
      if (error) throw error;
      
      toast.success('Role created successfully');
      return true;
      
    } catch (error: any) {
      console.error('Error creating role:', error);
      toast.error(error.message || 'Failed to create role');
      return false;
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
        return true;
      } catch (error: any) {
        console.error('Error removing user:', error);
        toast.error(error.message || 'Failed to remove user');
        return false;
      }
    }
    return false;
  };

  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        // Check if any users are using this role
        const { data: usersWithRole } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', roleId);
        
        if (usersWithRole && usersWithRole.length > 0) {
          toast.error('Cannot delete role that is assigned to users');
          return false;
        }
        
        const { error } = await supabase
          .from('custom_roles')
          .delete()
          .eq('id', roleId);
            
        if (error) throw error;
        
        toast.success('Role removed successfully');
        return true;
      } catch (error: any) {
        console.error('Error removing role:', error);
        toast.error(error.message || 'Failed to remove role');
        return false;
      }
    }
    return false;
  };

  // Get permissions from all roles for forms
  const permissions = useMemo(() => {
    const permissionSet = new Set<string>();
    // Common permissions every role should have
    permissionSet.add('view_products');
    permissionSet.add('sell_products');
    permissionSet.add('view_inventory');
    permissionSet.add('manage_inventory');
    
    // Add permissions from existing roles
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
  }, [roles]);

  // Calculate statistics
  const cashierCount = users.filter(user => user.role === 'cashier').length;
  const staffCount = users.filter(user => user.role === 'staff').length;
  const customRoleCount = users.filter(user => 
    user.role !== 'cashier' && 
    user.role !== 'manager' && 
    user.role !== 'owner' && 
    user.role !== 'staff'
  ).length;

  return {
    users,
    roles,
    isLoading,
    searchTerm,
    setSearchTerm,
    selectedUser,
    setSelectedUser,
    permissions,
    cashierCount,
    staffCount,
    customRoleCount,
    handleCreateUser,
    handleEditUser,
    handleCreateRole,
    handleDeleteUser,
    handleDeleteRole
  };
};
