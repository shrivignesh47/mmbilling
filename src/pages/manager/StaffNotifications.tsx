
import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Mail,
  Users,
  Send
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CustomRole, Notification, User } from "@/types/supabase-extensions";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const StaffNotifications: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: string, name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Form schema
  const formSchema = z.object({
    title: z.string().min(2, "Title is required"),
    message: z.string().min(2, "Message is required"),
    recipient_type: z.enum(["all", "role", "specific"]),
    role: z.string().optional(),
    user_ids: z.array(z.string()).optional(),
    priority: z.enum(["low", "medium", "high"])
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      message: "",
      recipient_type: "all",
      priority: "medium"
    }
  });

  // Watch the recipient type to conditionally render form fields
  const recipientType = form.watch("recipient_type");

  useEffect(() => {
    if (!profile?.shop_id) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Fetch sent notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('sender_id', profile?.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data as Notification[] || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        // Get users related to this manager's shop
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, role')
          .eq('shop_id', profile.shop_id)
          .neq('role', 'manager') // Don't include this manager
          .neq('role', 'owner');  // Don't include owners
          
        if (error) throw error;
        setUsers(data as User[] || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchRoles = async () => {
      try {
        // Standard cashier role
        const standardRoles = [
          { id: 'cashier', name: 'Cashiers' }
        ];
        
        // Get custom roles
        const { data, error } = await supabase
          .from('custom_roles')
          .select('id, name');

        if (error) throw error;
        setRoles([...standardRoles, ...(data || [])]);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchNotifications();
    fetchUsers();
    fetchRoles();
  }, [profile?.id, profile?.shop_id]);

  const handleSendNotification = async (values: z.infer<typeof formSchema>) => {
    if (!profile) return;
    
    try {
      // Prepare notification data
      const notificationData = {
        title: values.title,
        message: values.message,
        sender_id: profile.id,
        sender_name: profile.name,
        recipient_type: values.recipient_type,
        role: values.role,
        priority: values.priority,
        status: 'sent',
      };

      // Send notification
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) throw error;

      // If specific users selected, add them to notification_recipients
      if (values.recipient_type === 'specific' && values.user_ids?.length) {
        const recipientData = values.user_ids.map((userId: string) => ({
          notification_id: data[0].id,
          user_id: userId,
          read: false
        }));

        const { error: recipientsError } = await supabase
          .from('notification_recipients')
          .insert(recipientData);

        if (recipientsError) throw recipientsError;
      }

      // Show success message
      toast.success('Notification sent successfully');
      setIsFormOpen(false);
      form.reset();

      // Refresh notifications list
      const { data: updatedData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', profile.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotifications(updatedData as Notification[] || []);

    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    }
  };

  // Filter notifications based on search term
  const filteredNotifications = searchTerm
    ? notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : notifications;

  // Priority badge styling
  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  // Format recipient type for display
  const formatRecipientType = (notification: Notification) => {
    if (notification.recipient_type === 'all') {
      return 'All staff';
    } else if (notification.recipient_type === 'role' && notification.role) {
      const roleObj = roles.find(r => r.id === notification.role);
      return `Role: ${roleObj?.name || notification.role}`;
    } else if (notification.recipient_type === 'specific') {
      return `Selected staff`;
    }
    return notification.recipient_type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Notifications</h2>
        <p className="text-muted-foreground">
          Send notifications to your staff members
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Sent Notifications</CardTitle>
            <CardDescription>
              Notifications sent to your staff members
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Bell className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send Staff Notification</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSendNotification)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Notification title" {...field} />
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
                            placeholder="Enter your notification message" 
                            className="min-h-24" 
                            {...field} 
                          />
                        </FormControl>
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
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipient_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Send to</FormLabel>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="all">All staff</option>
                          <option value="role">By role</option>
                          <option value="specific">Specific staff members</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {recipientType === 'role' && (
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Role</FormLabel>
                          <select
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a role</option>
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
                  )}
                  
                  {recipientType === 'specific' && (
                    <FormField
                      control={form.control}
                      name="user_ids"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Staff Members</FormLabel>
                          <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                            {users.map((user) => (
                              <div key={user.id} className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`user-${user.id}`}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={(field.value || []).includes(user.id)}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    const value = field.value || [];
                                    if (checked) {
                                      field.onChange([...value, user.id]);
                                    } else {
                                      field.onChange(value.filter((id) => id !== user.id));
                                    }
                                  }}
                                />
                                <label htmlFor={`user-${user.id}`} className="ml-2 text-sm">
                                  {user.name} ({user.role === 'cashier' ? 'Cashier' : user.role})
                                </label>
                              </div>
                            ))}
                            {users.length === 0 && (
                              <p className="text-sm text-muted-foreground">No staff members available</p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Send className="mr-2 h-4 w-4" />
                      Send Notification
                    </Button>
                  </div>
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
              placeholder="Search notifications..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-5 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-1/4 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className="overflow-hidden">
                  <div className={`h-1 w-full ${
                    notification.priority === 'high' ? "bg-destructive" : 
                    notification.priority === 'medium' ? "bg-primary" : 
                    "bg-muted"
                  }`}></div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{notification.title}</CardTitle>
                        <CardDescription>
                          {formatRecipientType(notification)} • {new Date(notification.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div>
                        {priorityBadge(notification.priority)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <p className="text-sm">{notification.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No notifications found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm 
                  ? "No notifications match your search criteria." 
                  : "You haven't sent any notifications yet."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                  Send Your First Notification
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffNotifications;
