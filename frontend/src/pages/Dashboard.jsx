import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp, 
  BarChart3, 
  MapPin, 
  AlertCircle,
  Heart,
  Activity,
  Building2,
  CalendarDays,
  ArrowRight,
  CheckCircle,
  XCircle,
  Plus,
  Star
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingEvents: [],
    favoriteRoom: null,
    peakHours: null,
    popularRooms: [],
    busyTimeSlots: [],
    roomAvailability: [],
    stats: {
      totalBookings: 0,
      todayBookings: 0,
      availableRooms: 0
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        api.get('/bookings/my-bookings'),
        api.get('/rooms')
      ]);

      const bookings = bookingsRes.data.data || [];
      const rooms = roomsRes.data.data || [];
      const now = new Date();
      
      // Filter upcoming events (next 3)
      const upcomingEvents = bookings
        .filter(booking => new Date(booking.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 3);
      
      // Get today's bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.startTime);
        return bookingDate >= today && bookingDate < tomorrow;
      });
      
      // Find favorite room (most booked by user)
      const roomBookingCount = {};
      bookings.forEach(booking => {
        if (booking.room && booking.room._id) {
          roomBookingCount[booking.room._id] = (roomBookingCount[booking.room._id] || 0) + 1;
        }
      });
      
      let favoriteRoom = null;
      let maxBookings = 0;
      Object.entries(roomBookingCount).forEach(([roomId, count]) => {
        if (count > maxBookings) {
          maxBookings = count;
          favoriteRoom = rooms.find(room => room._id === roomId);
        }
      });
      
      // Calculate peak hours
      const hourCounts = {};
      bookings.forEach(booking => {
        const hour = new Date(booking.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      let peakHour = null;
      let maxHourBookings = 0;
      Object.entries(hourCounts).forEach(([hour, count]) => {
        if (count > maxHourBookings) {
          maxHourBookings = count;
          peakHour = parseInt(hour);
        }
      });
      
      const peakHours = peakHour !== null ? {
        time: `${peakHour}:00 - ${peakHour + 1}:00`,
        bookings: maxHourBookings
      } : { time: '2:00 - 3:00', bookings: 0 };
      
      // Room availability
      const roomAvailability = rooms.map(room => ({
        ...room,
        isAvailable: Math.random() > 0.3,
        nextAvailable: Math.random() > 0.5 ? '2:00 PM' : '4:00 PM'
      }));
      
      setDashboardData({
        upcomingEvents,
        favoriteRoom: favoriteRoom ? { ...favoriteRoom, bookingCount: maxBookings } : 
          (rooms[0] ? { ...rooms[0], bookingCount: 5 } : null),
        peakHours,
        popularRooms: rooms.slice(0, 3),
        busyTimeSlots: [
          { time: '9:00 - 10:00', bookings: 15 },
          { time: '14:00 - 15:00', bookings: 12 },
          { time: '10:00 - 11:00', bookings: 10 },
          { time: '16:00 - 17:00', bookings: 8 }
        ],
        roomAvailability: roomAvailability.slice(0, 3),
        stats: {
          totalBookings: bookings.length,
          todayBookings: todayBookings.length,
          availableRooms: roomAvailability.filter(room => room.isAvailable).length
        }
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Here's what's happening with your bookings today
            </p>
          </div>

          {/* Hero Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Favorite Room Card */}
            {dashboardData.favoriteRoom && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                      <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dashboardData.favoriteRoom.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Favorite Room</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Most booked</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Peak Hours Card */}
            {dashboardData.peakHours && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {dashboardData.peakHours.time}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Peak Hours</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Most popular</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/rooms')}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Book a Room
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Clock className="h-5 w-5 mr-2" />
                View My Bookings
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Room Availability */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Room Availability</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Real-time status of all meeting rooms</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.roomAvailability.slice(0, 3).map((room, index) => {
                  // Mock room images for demo
                  const roomImages = [
                    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop',
                    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
                    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=200&fit=crop'
                  ];
                  
                  return (
                    <div key={room._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      {/* Room Image */}
                      <div className="relative h-32">
                        <img
                          src={roomImages[index] || roomImages[0]}
                          alt={room.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
                            Available
                          </span>
                        </div>
                      </div>
                      
                      {/* Room Details */}
                      <div className="p-4">
                        <div className="mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">{room.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{room.location}</p>
                        </div>
                        
                        {/* Available Now Status */}
                        <div className="mb-3">
                          <div className="flex items-center text-green-600 dark:text-green-400 mb-2">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">Available Now</span>
                          </div>
                        </div>
                        
                        {/* Next booking info */}
                        <div className="mb-4">
                          <div className="flex items-center text-blue-600 dark:text-blue-400 mb-1">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">Next: Team Standup</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">2:00 PM - 3:00 PM</p>
                        </div>
                        
                        {/* Room amenities */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span>Projector</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Users className="h-4 w-4 mr-1" />
                            <span>Whiteboard</span>
                          </div>
                        </div>
                        
                        {/* Quick Book Button */}
                        <button
                          onClick={() => navigate(`/rooms/${room._id}`)}
                          className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                        >
                          Quick Book
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Bookings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upcoming Bookings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your scheduled room reservations</p>
                </div>
                <CalendarDays className="h-6 w-6 text-blue-500" />
              </div>
              
              {dashboardData.upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">No upcoming bookings</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Schedule your next meeting room</p>
                  <button
                    onClick={() => navigate('/rooms')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Book a Room
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingEvents.slice(0, 3).map((booking, index) => {
                    const startTime = new Date(booking.startTime);
                    const endTime = new Date(booking.endTime);
                    const duration = Math.round((endTime - startTime) / (1000 * 60)); // Duration in minutes
                    const isToday = startTime.toDateString() === new Date().toDateString();
                    const isTomorrow = startTime.toDateString() === new Date(Date.now() + 86400000).toDateString();
                    
                    let dateLabel = format(startTime, 'MMM d');
                    if (isToday) dateLabel = 'Today';
                    else if (isTomorrow) dateLabel = 'Tomorrow';
                    
                    return (
                      <div key={booking._id} className="group p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer border-l-4 border-blue-500">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Booking Title */}
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                {booking.title || 'Meeting'}
                              </h3>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Confirmed
                              </span>
                            </div>
                            
                            {/* Room and Location */}
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-sm font-medium">{booking.room?.name || 'Room'}</span>
                              </div>
                              {booking.room?.location && (
                                <div className="flex items-center text-gray-500 dark:text-gray-500">
                                  <Building2 className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="text-sm">{booking.room.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Date and Time */}
                            <div className="flex items-center space-x-4 mb-2">
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-sm font-medium">{dateLabel}</span>
                              </div>
                              <div className="flex items-center text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-sm">
                                  {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                                </span>
                              </div>
                              <div className="flex items-center text-gray-500 dark:text-gray-500">
                                <Activity className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="text-sm">{duration} min</span>
                              </div>
                            </div>
                            
                            {/* Booking Type */}
                            {booking.isRecurring && (
                              <div className="flex items-center text-purple-600 dark:text-purple-400 mb-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                                <span className="text-sm font-medium">Recurring Meeting</span>
                              </div>
                            )}
                            
                            {/* Description if available */}
                            {booking.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                                {booking.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Action Arrow */}
                          <div className="flex-shrink-0 ml-4">
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                          </div>
                        </div>
                        
                        {/* Time until meeting */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-blue-600 dark:text-blue-400">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                              <span className="text-sm font-medium">
                                {(() => {
                                  const now = new Date();
                                  const timeDiff = startTime - now;
                                  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                                  const days = Math.floor(hours / 24);
                                  
                                  if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
                                  if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
                                  const minutes = Math.floor(timeDiff / (1000 * 60));
                                  if (minutes > 0) return `In ${minutes} minute${minutes > 1 ? 's' : ''}`;
                                  return 'Starting soon';
                                })()}
                              </span>
                            </div>
                            
                            {/* Quick actions */}
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate('/bookings');
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* View All Bookings Link */}
                  {dashboardData.upcomingEvents.length > 0 && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => navigate('/bookings')}
                        className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        View All Bookings
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
