import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    todayBookings: 0,
    totalRooms: 0
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, roomsRes] = await Promise.all([
        api.get('/bookings/my-bookings?upcoming=true'),
        api.get('/rooms')
      ]);

      const bookings = bookingsRes.data.data;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.startTime);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      });

      setStats({
        upcomingBookings: bookings.length,
        todayBookings: todayBookings.length,
        totalRooms: roomsRes.data.data.length
      });

      setUpcomingBookings(bookings.slice(0, 5));
      setRooms(roomsRes.data.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Upcoming Bookings
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                        {stats.upcomingBookings}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Today's Bookings
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                        {stats.todayBookings}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                        Available Rooms
                      </dt>
                      <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                        {stats.totalRooms}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                onClick={() => navigate('/rooms')}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book a Room
              </button>
              <button
                onClick={() => navigate('/bookings')}
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Clock className="mr-2 h-5 w-5" />
                View My Bookings
              </button>
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Bookings</h2>
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No upcoming bookings</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking._id} className="border-l-4 border-primary-500 dark:border-primary-400 pl-4 py-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{booking.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{booking.room?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(booking.startTime), 'PPp')} - {format(new Date(booking.endTime), 'p')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Rooms */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Available Rooms</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div key={room._id} className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{room.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{room.location}</p>
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4 mr-1" />
                    Capacity: {room.capacity}
                  </div>
                  <button
                    onClick={() => navigate(`/rooms/${room._id}`)}
                    className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
