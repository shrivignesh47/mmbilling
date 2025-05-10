
import React from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Permission } from "@/types/staff";
import { UseFormReturn } from "react-hook-form";

interface CreateRoleFormProps {
  form: UseFormReturn<{
    name: string;
    description: string;
    permissions: string[];
  }>;
  permissions: Permission[];
  onSubmit: (values: any) => Promise<void>;
}

const CreateRoleForm: React.FC<CreateRoleFormProps> = ({ form, permissions, onSubmit }) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Inventory Manager" {...field} required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this role's responsibilities" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permissions</FormLabel>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {permissions.map(permission => (
                  <div key={permission.code} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`role-${permission.code}`}
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
                    <label htmlFor={`role-${permission.code}`} className="ml-2 text-sm">
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
          <Button type="submit" className="w-full sm:w-auto">Create Role</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default CreateRoleForm;
