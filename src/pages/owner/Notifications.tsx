
import React, { useState, useEffect } from "react";
import {
  Bell,
  Search,
  Mail,
  Filter,
  AlertCircle,
  CheckCircle,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationForm from "@/components/notifications/NotificationForm";

interface Notification {
  id: string;
  title: string;
  message: string;
  sender_id: string;
  sender_name?: string;
  recipient_type: "all" | "role" | "specific";
  role?: string;
  priority: "low" | "medium" | "high";
  created_at: string;
  status: "sent" | "delivered" | "failed";
}

interface User {
  id: string;
  name: string;
  role: string;
}

interface Role {
  id: string;
  name: string;
}

const NotificationsPage: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
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
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        // For managers and other relevant users
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, role')
          .in('role', ['manager', 'cashier'])
          .order('role');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchRoles = async () => {
      try {
        // Get standard and custom roles
        const standardRoles = [
          { id: 'manager', name: 'Manager' },
          { id: 'cashier', name: 'Cashier' },
        ];
        
        const { data, error } = await supabase
          .from('custom_roles')
          .select('id, name');

        if (error) throw error;
        setRoles([...standardRoles, ...(data || [])]);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    if (profile?.id) {
      fetchNotifications();
      fetchUsers();
      fetchRoles();
    }
  }, [profile?.id]);

  const handleSendNotification = async (values: any) => {
    try {
      // Prepare notification data
      const notificationData = {
        title: values.title,
        message: values.message,
        sender_id: profile?.id,
        sender_name: profile?.name,
        recipient_type: values.recipient_type,
        role: values.role,
        priority: values.priority,
        status: 'sent',
        user_ids: values.user_ids,
        send_email: values.send_email,
      };

      // Send notification
      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select();

      if (error) throw error;

      // Show success message
      toast.success('Notification sent successfully');
      setIsFormOpen(false);

      // Refresh notifications list
      const { data: updatedData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('sender_id', profile?.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotifications(updatedData || []);

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

  // Status badge styling
  const statusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Sent</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Delivered</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format recipient type for display
  const formatRecipientType = (notification: Notification) => {
    if (notification.recipient_type === 'all') {
      return 'All users';
    } else if (notification.recipient_type === 'role' && notification.role) {
      const roleObj = roles.find(r => r.id === notification.role);
      return `Role: ${roleObj?.name || notification.role}`;
    } else if (notification.recipient_type === 'specific') {
      return `Specific users`;
    }
    return notification.recipient_type;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">
          Send push notifications to managers and staff
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <CardTitle>Sent Notifications</CardTitle>
            <CardDescription>
              Manage and track notifications sent to your team
            </CardDescription>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Bell className="mr-2 h-4 w-4" />
            Send New Notification
          </Button>
        </CardHeader>
        
        <CardContent>
          {/* Search bar */}
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
                      <div className="flex space-x-2">
                        {priorityBadge(notification.priority)}
                        {statusBadge(notification.status)}
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

      {/* Send Notification Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <NotificationForm
            roles={roles}
            users={users}
            onSubmit={handleSendNotification}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationsPage;
