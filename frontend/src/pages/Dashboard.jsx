import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/bookings')  // Everyone sees all upcoming bookings
      ]);
      setRooms(roomsRes.data.data || []);
      setBookings(bookingsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings
    .filter(b => b.status === 'confirmed' && new Date(b.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 5);

  const availableRooms = rooms.filter(r => r.isActive).slice(0, 6);

  // Calculate favorite room (most booked)
  const getFavoriteRoom = () => {
    if (bookings.length === 0) return null;
    
    const roomCounts = {};
    bookings.forEach(booking => {
      if (booking.room && booking.room._id) {
        const roomId = booking.room._id;
        roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;
      }
    });

    const mostBookedRoomId = Object.keys(roomCounts).reduce((a, b) => 
      roomCounts[a] > roomCounts[b] ? a : b, null
    );

    const favoriteRoom = bookings.find(b => b.room && b.room._id === mostBookedRoomId)?.room;
    return favoriteRoom ? {
      name: favoriteRoom.name,
      count: roomCounts[mostBookedRoomId]
    } : null;
  };

  // Calculate peak hours (most popular booking time)
  const getPeakHours = () => {
    if (bookings.length === 0) return null;
    
    const hourCounts = {};
    bookings.forEach(booking => {
      const hour = new Date(booking.startTime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b, null
    );

    if (peakHour) {
      const startHour = parseInt(peakHour);
      const endHour = startHour + 1;
      
      // Convert to 12-hour format
      const formatHour = (hour) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:00 ${ampm}`;
      };
      
      return {
        time: `${formatHour(startHour)} - ${formatHour(endHour)}`,
        count: hourCounts[peakHour]
      };
    }
    return null;
  };

  const favoriteRoom = getFavoriteRoom();
  const peakHours = getPeakHours();

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-white border-b border-pink-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 text-center">
          <h1 className="text-6xl md:text-7xl font-light text-pink-900 mb-6 tracking-tight">
            Have a great meeting
          </h1>
          <p className="text-xl text-pink-600 font-light mb-8">
            explore the rooms
          </p>
          <button
            onClick={() => navigate('/rooms')}
            className="px-8 py-4 bg-pink-600 text-white text-sm tracking-wide hover:bg-pink-700 transition-colors"
          >
            browse rooms
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Welcome */}
        <div className="mb-12">
          <h2 className="text-3xl font-light text-pink-900 mb-2">
            Welcome back, {user?.name}
          </h2>
          <p className="text-pink-600">
            Here's what's happening with your Bookings
          </p>
        </div>

        {/* Favorite Room & Peak Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {/* Favorite Room */}
          <div className="bg-white shadow-sm border border-pink-100 p-8">
            <p className="text-sm text-pink-600 mb-4">favorite room</p>
            {favoriteRoom ? (
              <>
                <h3 className="text-3xl font-light text-pink-900 mb-2">{favoriteRoom.name}</h3>
                <p className="text-sm text-pink-600">most booked • {favoriteRoom.count} bookings</p>
              </>
            ) : (
              <p className="text-pink-600">no bookings yet</p>
            )}
          </div>

          {/* Peak Hours */}
          <div className="bg-white shadow-sm border border-pink-100 p-8">
            <p className="text-sm text-pink-600 mb-4">peak hours</p>
            {peakHours ? (
              <>
                <h3 className="text-3xl font-light text-pink-900 mb-2">{peakHours.time}</h3>
                <p className="text-sm text-pink-600">most popular • {peakHours.count} bookings</p>
              </>
            ) : (
              <p className="text-pink-600">no bookings yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Events & Room Availability Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Room Availability */}
          <div>
            <h3 className="text-xl font-normal text-pink-900 mb-2">Room Availability</h3>
            <p className="text-sm text-pink-600 mb-6">Real-time status of all meeting rooms</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableRooms.slice(0, 3).map((room) => (
                <div key={room._id} className="bg-white shadow-sm border border-pink-100 rounded-lg overflow-hidden hover:shadow-md transition-all">
                  <div className="relative">
                    {room.imageUrl ? (
                      <img
                        src={room.imageUrl}
                        alt={room.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-pink-100 to-pink-200"></div>
                    )}
                    <span className="absolute top-2 right-2 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                      Available
                    </span>
                  </div>
                  <div className="p-4">
                    <h4 className="text-base font-semibold text-pink-900 mb-1">{room.name}</h4>
                    <p className="text-xs text-pink-600 mb-3">{room.location}</p>
                    <div className="flex items-center gap-2 text-xs text-pink-700 mb-2">
                      <span className="flex items-center gap-1">
                        <span className="text-pink-600">📅</span>
                        <span className="text-green-600 font-medium">Available Now</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-pink-700 mb-3">
                      <span className="flex items-center gap-1">
                        <span className="text-pink-600">👥</span>
                        {room.capacity} people
                      </span>
                    </div>
                    <button
                      onClick={() => navigate(`/rooms/${room._id}`)}
                      className="w-full py-2 bg-pink-600 text-white text-sm font-medium rounded hover:bg-pink-700 transition-colors"
                    >
                      Quick Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-normal text-pink-900">Upcoming Events</h3>
              <button className="text-pink-600 hover:text-pink-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <div className="bg-white shadow-sm border border-pink-100 rounded-lg p-6">
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-pink-600">No upcoming events</p>
                  <button
                    onClick={() => navigate('/rooms')}
                    className="mt-4 px-6 py-2 bg-pink-600 text-white text-sm rounded hover:bg-pink-700 transition-colors"
                  >
                    Book a Room
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking._id} className="flex items-center justify-between py-3 border-b border-pink-100 last:border-0 hover:bg-pink-50 transition-colors cursor-pointer group">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-2 h-2 rounded-full bg-pink-600 mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-pink-900 mb-1">{booking.title}</h4>
                          <p className="text-xs text-pink-600">
                            {booking.room?.name} • {format(new Date(booking.startTime), 'MMM dd h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h3 className="text-xl font-normal text-pink-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/rooms')}
              className="bg-pink-600 text-white py-4 px-6 rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Book a Room
            </button>
            <button
              onClick={() => navigate('/bookings')}
              className="bg-white border border-pink-300 text-pink-700 py-4 px-6 rounded-lg text-sm font-medium hover:bg-pink-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {isAdmin() ? 'All Bookings' : 'View My Bookings'}
            </button>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="mt-20 bg-white shadow-sm border border-pink-100 p-12 text-center">
          <p className="text-2xl font-light text-pink-900 mb-4">
            "seamless booking experience"
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
