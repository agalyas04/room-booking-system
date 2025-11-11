import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react'; // React hooks
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Bell, BarChart3, Settings, LogOut, Users, DoorOpen, User } from 'lucide-react';
import api from '../utils/api';

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
    <nav className="bg-white border-b border-pink-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo & Brand */}
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
              <span className="text-2xl font-light text-pink-900 tracking-tight">Room Booking Lite</span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-2">
              <Link
                to="/dashboard"
                className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'text-pink-900 border-b-2 border-pink-600'
                    : 'text-pink-700 hover:text-pink-900'
                }`}
              >
                dashboard
              </Link>
              <Link
                to="/bookings"
                className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                  location.pathname === '/bookings'
                    ? 'text-pink-900 border-b-2 border-pink-600'
                    : 'text-pink-700 hover:text-pink-900'
                }`}
              >
                {isAdmin() ? 'all bookings' : 'my bookings'}
              </Link>
              <Link
                to="/rooms"
                className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                  location.pathname === '/rooms'
                    ? 'text-pink-900 border-b-2 border-pink-600'
                    : 'text-pink-700 hover:text-pink-900'
                }`}
              >
                rooms
              </Link>
              {isAdmin() && (
                <>
                  <Link
                    to="/admin/analytics"
                    className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                      location.pathname === '/admin/analytics'
                        ? 'text-pink-900 border-b-2 border-pink-600'
                        : 'text-pink-700 hover:text-pink-900'
                    }`}
                  >
                    analytics
                  </Link>
                  <Link
                    to="/admin/rooms"
                    className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                      location.pathname === '/admin/rooms'
                        ? 'text-pink-900 border-b-2 border-pink-600'
                        : 'text-pink-700 hover:text-pink-900'
                    }`}
                  >
                    manage rooms
                  </Link>
                </>
              )}
            </div>
          </div>
          
          {/* Right Side - Notifications & User */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <Link
              to="/notifications"
              className="relative p-2 text-pink-700 hover:text-pink-900 transition-colors"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-pink-600 rounded-full">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 ml-2">
              <Link 
                to="/profile" 
                className="flex items-center space-x-3 px-3 py-1.5 hover:bg-pink-50 transition-colors group"
              >
                <div className="relative">
                  <img
                    src={user?.displayPicture || user?.avatar}
                    alt={user?.name}
                    className="h-9 w-9 rounded-full border-2 border-pink-200 group-hover:border-pink-300 transition-colors"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                <div className="hidden lg:block text-sm">
                  <p className="font-light text-pink-900 leading-tight">{user?.name}</p>
                </div>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-pink-700 hover:text-pink-900 transition-colors group"
                title="Logout"
              >
                <LogOut className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
