import React, { useState, useEffect } from 'react';
import { Notification } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, RefreshCw, Trash2, CheckCheck, Mail, Info, AlertTriangle, ShieldX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import ProtectedComponent from '@/components/common/ProtectedComponent';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await User.me();
      setCurrentUser(user);
      await loadNotifications(user.id);
    } catch (err) {
      console.error("Error loading user data:", err);
      setError('Failed to identify user. Please try logging in again.');
      setIsLoading(false);
    }
  };

  const loadNotifications = async (userId) => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      // **FIX: Added a limit of 100 to prevent timeouts on large datasets.**
      const userNotifications = await Notification.filter({ RecipientUserId: userId }, '-created_date', 100);
      setNotifications(userNotifications || []);
    } catch (err) {
      console.error("Full error object on Notifications page:", err);
      setError('A network error occurred while fetching notifications. Please try again.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { IsRead: true, ReadAt: new Date().toISOString() });
      // Update local state
      setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, IsRead: true} : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.IsRead);
    if (unreadNotifications.length === 0) return;

    setIsLoading(true);
    setNotifications(prev => prev.map(n => ({...n, IsRead: true})));
    
    try {
      await Promise.all(
        unreadNotifications.map(n => Notification.update(n.id, { IsRead: true, ReadAt: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // Revert local changes on error
      await loadNotifications(currentUser.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (notificationId) => {
    const originalNotifications = [...notifications];
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    try {
      await Notification.delete(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
      setNotifications(originalNotifications);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.IsRead) {
      handleMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };
  
  const getNotificationIcon = (notification) => {
    if (!notification.IsRead) {
      return <Badge variant="default" className="bg-blue-500 text-white">New</Badge>;
    }
    const icons = {
      discount_request: <Info className="text-blue-500" />,
      discount_approved: <CheckCheck className="text-green-500" />,
      discount_rejected: <AlertTriangle className="text-red-500" />,
      task_assigned: <Bell className="text-purple-500" />,
      communication_received: <Mail className="text-gray-500" />,
      default: <Bell className="text-gray-500" />,
    };
    return icons[notification.type] || icons.default;
  };
  
  if (!currentUser && isLoading) {
      return <div className="p-6 text-center">Loading user data...</div>;
  }

  return (
    <ProtectedComponent module="notifications" action="read">
      <div className="p-4 space-y-4 min-h-screen">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">My Notifications</h1>
            <p className="text-sm text-gray-600">All your system notifications in one place.</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => loadNotifications(currentUser?.id)} 
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <ProtectedComponent module="notifications" action="update">
              <Button 
                onClick={handleMarkAllAsRead} 
                disabled={isLoading || notifications.filter(n => !n.IsRead).length === 0}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All as Read
              </Button>
            </ProtectedComponent>
          </div>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
            <ShieldX className="w-5 h-5"/>
            <div>
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto bg-white"
              onClick={() => loadNotifications(currentUser?.id)}
            >
              Try Again
            </Button>
          </div>
        )}

        <Card className="clay-card">
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Showing the latest {notifications.length} notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))
              ) : notifications.length > 0 ? (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-4 p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
                      notification.IsRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification)}</div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                        {!notification.IsRead && (
                          <Badge variant="default" className="bg-blue-500 text-white">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true, locale: ar })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <ProtectedComponent module="notifications" action="delete">
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                  e.stopPropagation(); // Prevent card click
                                  handleDelete(notification.id);
                              }}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                          >
                              <Trash2 className="w-4 h-4" />
                          </Button>
                      </ProtectedComponent>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold">Your inbox is empty</h3>
                  <p>When you get new notifications, they'll show up here.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedComponent>
  );
}