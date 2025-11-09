import { Link, useNavigate, useLocation } from 'react-router-dom';
// React hook
import { useState } from 'react'; 
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Bell, BarChart3, Settings, LogOut, Users, DoorOpen, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../utils/api';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications?unreadOnly=true');
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <DoorOpen className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Room Booking Lite</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/bookings"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/bookings')}`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                My Bookings
              </Link>
              <Link
                to="/rooms"
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/rooms')}`}
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                Rooms
              </Link>
              {isAdmin() && (
                <>
                  <Link
                    to="/admin/analytics"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/analytics')}`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                  <Link
                    to="/admin/rooms"
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/rooms')}`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Rooms
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Link
              to="/notifications"
              className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="ml-3 flex items-center space-x-4">
              <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80">
                <img
                  src={user?.displayPicture || user?.avatar}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full border-2 border-gray-200 dark:border-gray-600"
                />
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{user?.role}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
