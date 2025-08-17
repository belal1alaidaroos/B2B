import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Notification } from '@/api/entities';
import { User } from '@/api/entities';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const loadUserAndNotifications = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
                fetchNotifications(user);
            } catch (error) {
                // Not logged in
            }
        };
        loadUserAndNotifications();
        
        const interval = setInterval(loadUserAndNotifications, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async (user) => {
        if (!user) return;
        
        try {
            // Fetch notifications for this user OR notifications for one of the user's roles
            // This is a simplified client-side filter. A real implementation should do this on the backend.
            const allSystemNotifications = await Notification.filter({ IsRead: false }, '-created_date', 20);
            
            // Ensure we have an array to work with
            const notifications = Array.isArray(allSystemNotifications) ? allSystemNotifications : [];
            
            const userNotifications = notifications.filter(n => {
                const isForMe = n.RecipientUserId === user.id;
                const isForMyRole = n.data?.recipient_role_id && user.roles?.includes(n.data.recipient_role_id);
                // "system_notification_recipient" is a catch-all for role-based notifications
                const isCatchAllForMyRole = n.RecipientUserId === 'system_notification_recipient' && isForMyRole;

                return isForMe || isCatchAllForMyRole;
            });

            setNotifications(userNotifications);
            setUnreadCount(userNotifications.length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Set empty arrays on error to prevent UI issues
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await Notification.update(id, { IsRead: true });
            fetchNotifications(currentUser);
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 clay-card" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map(n => (
                        <DropdownMenuItem key={n.id} className="p-2 data-[highlighted]:bg-gray-100/50" onSelect={(e) => e.preventDefault()}>
                            <Link to={n.action_url || '#'} className="w-full" onClick={() => handleMarkAsRead(n.id)}>
                                <div className="flex flex-col">
                                    <p className="font-semibold text-sm">{n.title}</p>
                                    <p className="text-xs text-gray-600 mb-1">{n.message}</p>
                                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(n.created_date), { addSuffix: true })}</p>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                        You're all caught up!
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}