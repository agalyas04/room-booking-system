import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { 
  Bell, 
  CheckCircle, 
  Trash2, 
  Calendar,
  XCircle,
  Info,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === id ? { ...notif, isRead: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'booking_cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'booking_reminder':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      case 'booking_updated':
        return <Calendar className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark All as Read
              </button>
            )}
          </div>

          {/* Filter */}
          <div className="mb-6 flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  filter === 'unread'
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No notifications</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {filter === 'unread' ? "You're all caught up!" : "You haven't received any notifications yet."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={`${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
                    } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${
                              !notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(notification.createdAt), 'PPp')}
                            </p>
                            {notification.booking && (
                              <div className="mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                                  Booking: {notification.booking.title}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                              title="Mark as read"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
