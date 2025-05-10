
import React from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomRole, UserRole } from "@/types/supabase-extensions";
import { Permission } from "@/types/staff";
import { UseFormReturn } from "react-hook-form";

interface EditUserFormProps {
  form: UseFormReturn<{
    name: string;
    role: UserRole;
    custom_permissions: string[];
  }>;
  permissions: Permission[];
  roles: CustomRole[];
  onSubmit: (values: any) => Promise<void>;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ form, permissions, roles, onSubmit }) => {
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
          name="custom_permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Permissions</FormLabel>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {permissions.map(permission => (
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
  );
};

export default EditUserForm;
