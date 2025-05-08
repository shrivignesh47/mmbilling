
import React, { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { Notification, NotificationRecipient } from "@/types/supabase-extensions";
import { useAuth } from "@/contexts/auth";

const NotificationIndicator = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Array<Notification & { recipient_id?: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    
    // Fetch notifications for this user
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        // Get notifications for all users
        const { data: allNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_type', 'all')
          .order('created_at', { ascending: false })
          .limit(5);
  
        // Get notifications for user's role
        const { data: roleNotifications } = await supabase
          .from('notifications')
          .select('*')
          .eq('recipient_type', 'role')
          .eq('role', profile.role)
          .order('created_at', { ascending: false })
          .limit(5);
  
        // Get notifications specifically for this user
        const { data: specificRecipients } = await supabase
          .from('notification_recipients')
          .select('*, notification:notifications(*)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5);
  
        // Combine and format notifications
        const allNotifs = [
          ...(allNotifications || []).map(n => ({ ...n, read: false })), 
          ...(roleNotifications || []).map(n => ({ ...n, read: false })),
          ...(specificRecipients || []).map(r => ({ 
            ...r.notification, 
            recipient_id: r.id,
            read: r.read
          }))
        ];
        
        // Sort by date and limit
        const sortedNotifications = allNotifs
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setNotifications(sortedNotifications as Array<Notification & { recipient_id?: string }>);
        setUnreadCount(sortedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notification-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        fetchNotifications
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification_recipients' },
        fetchNotifications
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);

  const markAsRead = async (notificationId: string, recipientId?: string) => {
    if (recipientId) {
      // Update specific recipient
      await supabase
        .from('notification_recipients')
        .update({ read: true })
        .eq('id', recipientId);
    } 
    
    // Update the state locally
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Recalculate unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
        </div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <div
                  key={notification.id + (notification.recipient_id || '')}
                  className={`p-4 border-b flex items-start justify-between ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-full"
                      onClick={() => markAsRead(notification.id, notification.recipient_id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Mark as read</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationIndicator;
