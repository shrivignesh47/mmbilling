
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Notification title must be at least 2 characters.",
  }),
  message: z.string().min(5, {
    message: "Message must be at least 5 characters.",
  }),
  recipient_type: z.enum(["all", "role", "specific"]),
  role: z.string().optional(),
  user_ids: z.array(z.string()).optional(),
  priority: z.enum(["low", "medium", "high"]),
  send_email: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface NotificationFormProps {
  roles: { id: string; name: string }[];
  users: { id: string; name: string; role: string }[];
  onSubmit: (values: FormValues) => Promise<void>;
  onCancel: () => void;
}

const NotificationForm: React.FC<NotificationFormProps> = ({
  roles,
  users,
  onSubmit,
  onCancel,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      recipient_type: "all",
      priority: "medium",
      send_email: false,
      user_ids: [],
    },
  });

  const recipientType = form.watch("recipient_type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notification Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter notification title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter notification message"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="recipient_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recipients</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="role">By Role</SelectItem>
                    <SelectItem value="specific">Specific Users</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {recipientType === "role" && (
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
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
        )}

        {recipientType === "specific" && (
          <FormField
            control={form.control}
            name="user_ids"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Users</FormLabel>
                <div className="h-[200px] overflow-y-auto border rounded p-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center space-x-2 py-2">
                      <Checkbox
                        checked={field.value?.includes(user.id)}
                        onCheckedChange={(checked) => {
                          const updatedUsers = checked
                            ? [...(field.value || []), user.id]
                            : (field.value || []).filter((id) => id !== user.id);
                          field.onChange(updatedUsers);
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="send_email"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Also send as email</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Recipients will also get this notification via email if they have an email address.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Send Notification</Button>
        </div>
      </form>
    </Form>
  );
};

export default NotificationForm;
