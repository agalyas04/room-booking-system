import { useState, useEffect } from 'react'; // React hooks
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
        return <Info className="h-5 w-5 text-pink-600" />;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-pink-900 mb-4">
            notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-lg text-pink-600 font-light">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
        {/* Actions & Filter */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                filter === 'all'
                  ? 'bg-pink-600 text-white'
                  : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
              }`}
            >
              all
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                filter === 'unread'
                  ? 'bg-pink-600 text-white'
                  : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
              }`}
            >
              unread ({unreadCount})
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 text-sm tracking-wide text-pink-700 border border-pink-200 hover:bg-pink-50 transition-colors"
            >
              mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white shadow-sm">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-pink-600 text-lg font-light">no notifications</p>
              <p className="mt-2 text-sm text-gray-400">
                {filter === 'unread' ? "you're all caught up" : "you haven't received any notifications yet"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <li
                  key={notification._id}
                  className={`${
                    !notification.isRead ? 'bg-pink-100' : 'bg-white'
                  } hover:bg-pink-50 transition-colors`}
                >
                  <div className="px-8 py-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${
                            !notification.isRead ? 'font-medium text-pink-900' : 'text-pink-700'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-pink-600">
                            {format(new Date(notification.createdAt), 'PPp')}
                          </p>
                          {notification.room && (
                            <div className="mt-2">
                              <span className="inline-flex items-center px-3 py-1 text-xs tracking-wide bg-gray-100 text-pink-700">
                                room: {notification.room.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-pink-600 hover:text-pink-900 transition-colors"
                            title="mark as read"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="delete"
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
  );
};

export default Notifications;
