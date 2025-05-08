
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import NotificationForm from "@/components/notifications/NotificationForm";
import { User } from "@/types/supabase-extensions"; 
import { Bell, Send } from "lucide-react";

interface NotificationFormValues {
  title: string;
  message: string;
  recipient_type: "role" | "all" | "specific";
  role?: string;
  recipients?: string[];
  priority: "high" | "medium" | "low";
}

const StaffNotifications: React.FC = () => {
  const { profile } = useAuth();
  const [shopStaff, setShopStaff] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all staff members for this shop
  const fetchShopStaff = async () => {
    if (!profile?.shop_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('shop_id', profile.shop_id)
        .neq('role', 'manager'); // Exclude managers, we only want staff

      if (error) throw error;
      
      setShopStaff(data as User[] || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast.error('Failed to load staff members');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShopStaff();
  }, [profile?.shop_id]);

  // Changed the return type to Promise<void> to match the NotificationForm's expected type
  const handleSendNotification = async (formValues: NotificationFormValues): Promise<void> => {
    try {
      // Create the notification
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .insert({
          title: formValues.title,
          message: formValues.message,
          sender_id: profile?.id,
          sender_name: profile?.name,
          recipient_type: formValues.recipient_type,
          role: formValues.role || null,
          status: 'sent',
          priority: formValues.priority
        })
        .select('id');

      if (notificationError) throw notificationError;

      if (!notification?.[0]?.id) {
        throw new Error('Failed to create notification');
      }

      const notificationId = notification[0].id;

      // Create notification recipients based on the recipient type
      if (formValues.recipient_type === 'all') {
        // Send to all staff in this shop
        const recipients = shopStaff.map(user => ({
          notification_id: notificationId,
          user_id: user.id,
          read: false
        }));

        if (recipients.length > 0) {
          const { error: recipientError } = await supabase
            .from('notification_recipients')
            .insert(recipients);

          if (recipientError) throw recipientError;
        }
      } else if (formValues.recipient_type === 'specific' && formValues.recipients) {
        // Send to specific users
        const recipients = formValues.recipients.map((userId: string) => ({
          notification_id: notificationId,
          user_id: userId,
          read: false
        }));

        if (recipients.length > 0) {
          const { error: recipientError } = await supabase
            .from('notification_recipients')
            .insert(recipients);

          if (recipientError) throw recipientError;
        }
      } else if (formValues.recipient_type === 'role' && formValues.role) {
        // Send to users with a specific role
        const filteredStaff = shopStaff.filter(user => 
          user.role === formValues.role
        );

        const recipients = filteredStaff.map(user => ({
          notification_id: notificationId,
          user_id: user.id,
          read: false
        }));

        if (recipients.length > 0) {
          const { error: recipientError } = await supabase
            .from('notification_recipients')
            .insert(recipients);

          if (recipientError) throw recipientError;
        }
      }

      toast.success('Notification sent successfully');
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error(error.message || 'Failed to send notification');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Staff Notifications</h2>
        <p className="text-muted-foreground">
          Send notifications to your shop staff
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading staff members...</div>
          ) : shopStaff.length > 0 ? (
            <NotificationForm 
              users={shopStaff} 
              onSubmit={handleSendNotification}
            />
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No staff members found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You need to add staff members to your shop before sending notifications.
              </p>
              <Button className="mt-4">
                <Send className="mr-2 h-4 w-4" />
                Add Staff Members
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffNotifications;
