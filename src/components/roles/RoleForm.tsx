
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Permission {
  id: string;
  name: string;
  description: string;
  code: string;
}

interface RoleFormProps {
  initialData?: {
    id?: string;
    name: string;
    description: string;
    permissions: string[];
  };
  availablePermissions: Permission[];
  onSubmit: (data: {
    name: string;
    description: string;
    permissions: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Role name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

const RoleForm: React.FC<RoleFormProps> = ({
  initialData,
  availablePermissions,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      permissions: initialData?.permissions || [],
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convert the form values to the required data format for onSubmit
      const submitData = {
        name: values.name,
        description: values.description || "",
        permissions: values.permissions,
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting role:", error);
      toast.error("Failed to save role");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter role name" {...field} />
              </FormControl>
              <FormDescription>
                A clear, descriptive name for this role
              </FormDescription>
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
                  placeholder="Describe the purpose of this role"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availablePermissions.map((permission) => (
              <FormField
                key={permission.code}
                control={form.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(permission.code)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.onChange([...field.value, permission.code]);
                          } else {
                            field.onChange(
                              field.value?.filter(
                                (value) => value !== permission.code
                              )
                            );
                          }
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        {permission.name}
                      </FormLabel>
                      <FormDescription className="text-xs">
                        {permission.description}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Role</Button>
        </div>
      </form>
    </Form>
  );
};

export default RoleForm;
