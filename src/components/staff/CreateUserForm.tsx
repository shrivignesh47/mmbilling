
import React, { useState } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomRole, UserRole } from "@/types/supabase-extensions";
import { Permission } from "@/types/staff";
import { UseFormReturn } from "react-hook-form";

interface CreateUserFormProps {
  form: UseFormReturn<{
    email: string;
    password: string;
    name: string;
    role: UserRole;
    custom_role_id: string | null;
    custom_permissions: string[];
  }>;
  permissions: Permission[];
  roles: CustomRole[];
  onSubmit: (values: any) => Promise<void>;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ form, permissions, roles, onSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="custom_role_id" // Added custom_role_id field
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Role ID (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter custom role ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <FormField
            control={form.control}
            name="custom_permissions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Permissions (Optional)</FormLabel>
                <Select
                  onValueChange={(selectedValue) => {
                    const currentValues = field.value || [];
                    const newValues = currentValues.includes(selectedValue)
                      ? currentValues.filter((value) => value !== selectedValue)
                      : [...currentValues, selectedValue];
                    field.onChange(newValues);
                  }}
                  value={field.value.join(', ')} // Display selected values as a comma-separated string
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select permissions" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {permissions.map((permission) => (
                      <SelectItem key={permission.code} value={permission.code}>
                        {permission.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        
        <DialogFooter>
          <Button type="submit" className="w-full sm:w-auto">Create Staff Member</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default CreateUserForm;
