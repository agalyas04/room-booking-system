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
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-2xl border-b border-blue-500/20 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo & Brand */}
            <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
                <DoorOpen className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-white tracking-tight cursor-pointer">Room Booking Lite</span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-2">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/dashboard'
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/bookings"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/bookings'
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {isAdmin() ? 'All Bookings' : 'My Bookings'}
              </Link>
              <Link
                to="/rooms"
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === '/rooms'
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <DoorOpen className="h-4 w-4 mr-2" />
                Rooms
              </Link>
              {isAdmin() && (
                <>
                  <Link
                    to="/admin/analytics"
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === '/admin/analytics'
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Link>
                  <Link
                    to="/admin/rooms"
                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === '/admin/rooms'
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Rooms
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
              className="relative p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 ml-2">
              <Link 
                to="/profile" 
                className="flex items-center space-x-3 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
              >
                <div className="relative">
                  <img
                    src={user?.displayPicture || user?.avatar}
                    alt={user?.name}
                    className="h-9 w-9 rounded-full border-2 border-white/30 group-hover:border-white/50 transition-all duration-200 shadow-lg"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 border-2 border-blue-700 rounded-full"></div>
                </div>
                <div className="hidden lg:block text-sm cursor-pointer">
                  <p className="font-semibold text-white leading-tight cursor-pointer">{user?.name}</p>
                </div>
              </Link>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-white/80 hover:bg-red-500/20 hover:text-white transition-all duration-200 group"
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
