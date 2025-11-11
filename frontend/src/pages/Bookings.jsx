import { useState, useEffect } from 'react'; // React hooks
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  X,
  CheckCircle,
  XCircle,
  Edit2,
  Filter,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

const Bookings = () => {
  const { user, isAdmin } = useAuth();
  const { socket } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [statusFilter, setStatusFilter] = useState('all'); // all, confirmed, cancelled
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('booking-updated', handleBookingUpdate);
      socket.on('booking-cancelled', handleBookingUpdate);

      return () => {
        socket.off('booking-updated', handleBookingUpdate);
        socket.off('booking-cancelled', handleBookingUpdate);
      };
    }
  }, [socket]);

  const handleBookingUpdate = () => {
    fetchBookings();
  };

  const fetchBookings = async () => {
    try {
      // Admins see all bookings, regular users see only their bookings
      const endpoint = isAdmin() ? '/bookings' : '/bookings/my-bookings';
      const response = await api.get(endpoint);
      setBookings(response.data.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (booking) => {
    setCancellingBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a cancellation reason' });
      return;
    }

    try {
      await api.patch(`/bookings/${cancellingBooking._id}/cancel`, {
        cancellationReason: cancelReason
      });
      
      setMessage({ type: 'success', text: 'Booking cancelled successfully' });
      await fetchBookings();
      
      setTimeout(() => {
        setShowCancelModal(false);
        setCancellingBooking(null);
        setCancelReason('');
        setMessage({ type: '', text: '' });
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to cancel booking'
      });
    }
  };

  const handleDeleteBooking = async (bookingId, bookingTitle) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${bookingTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/bookings/${bookingId}`);
      setMessage({ type: 'success', text: 'Booking deleted successfully' });
      await fetchBookings();
      
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete booking'
      });
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    
    let filtered = [...bookings]; // Create a copy to avoid mutation

    // Debug: Log current filter state
    console.log('Current filters:', { filter, statusFilter });
    console.log('Total bookings:', bookings.length);
    console.log('Current time:', now);

    // Filter by time
    if (filter === 'upcoming') {
      filtered = filtered.filter(b => {
        const startTime = new Date(b.startTime);
        const isUpcoming = startTime > now;
        const isNotCancelled = b.status !== 'cancelled';
        const shouldShow = isUpcoming && isNotCancelled;
        console.log(`Booking ${b.title}: startTime=${startTime}, isUpcoming=${isUpcoming}, status=${b.status}, shouldShow=${shouldShow}`);
        return shouldShow;
      });
    } else if (filter === 'past') {
      filtered = filtered.filter(b => {
        const endTime = new Date(b.endTime);
        const isPast = endTime < now;
        console.log(`Booking ${b.title}: endTime=${endTime}, isPast=${isPast}`);
        return isPast;
      });
    }

    console.log('After time filter:', filtered.length);

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => {
        const matchesStatus = b.status === statusFilter;
        console.log(`Booking ${b.title}: status=${b.status}, matches=${matchesStatus}`);
        return matchesStatus;
      });
    }

    console.log('After status filter:', filtered.length);

    // Sort based on filter type
    if (filter === 'upcoming') {
      // Upcoming events: ascending order (earliest first)
      return filtered.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    } else {
      // All/Past events: descending order (most recent first)
      return filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const isPastBooking = (booking) => {
    return new Date(booking.endTime) < new Date();
  };

  const canCancelBooking = (booking) => {
    return booking.status === 'confirmed' && !isPastBooking(booking);
  };

  const filteredBookings = getFilteredBookings();

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
            {isAdmin() ? 'all bookings' : 'my bookings'}
          </h1>
          <p className="text-lg text-pink-600 font-light">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Filters */}
        <div className="bg-white shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs text-pink-600 mb-2 tracking-wide">time</label>
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
                  onClick={() => setFilter('upcoming')}
                  className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                    filter === 'upcoming'
                      ? 'bg-pink-600 text-white'
                      : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
                  }`}
                >
                  upcoming
                </button>
                <button
                  onClick={() => setFilter('past')}
                  className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                    filter === 'past'
                      ? 'bg-pink-600 text-white'
                      : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
                  }`}
                >
                  past
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-pink-600 mb-2 tracking-wide">status</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-pink-600 text-white'
                      : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
                  }`}
                >
                  all
                </button>
                <button
                  onClick={() => setStatusFilter('confirmed')}
                  className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                    statusFilter === 'confirmed'
                      ? 'bg-pink-600 text-white'
                      : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
                  }`}
                >
                  confirmed
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-4 py-2 text-sm tracking-wide transition-colors ${
                    statusFilter === 'cancelled'
                      ? 'bg-pink-600 text-white'
                      : 'border border-pink-200 text-pink-700 hover:bg-pink-50'
                  }`}
                >
                  cancelled
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white shadow-sm p-12 text-center">
            <p className="text-pink-600 text-lg font-light">no bookings found</p>
            <p className="mt-2 text-sm text-gray-400">
              {filter === 'upcoming' ? "you don't have any upcoming bookings" : 
               filter === 'past' ? "you don't have any past bookings" :
               "you haven't made any bookings yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-2xl font-light text-pink-900">
                          {booking.title}
                        </h3>
                        <span className={`text-xs tracking-wide px-3 py-1 ${
                          booking.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                          'bg-pink-50 text-pink-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-pink-600 mb-4">
                        <p>{booking.room?.name} • {booking.room?.location}</p>
                        <p>{format(new Date(booking.startTime), 'PPP')}</p>
                        <p>{format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}</p>
                        {booking.attendees && booking.attendees.length > 0 && (
                          <p>{booking.attendees.length} attendee{booking.attendees.length !== 1 ? 's' : ''}</p>
                        )}
                      </div>

                      {booking.recurrenceGroup && (
                        <div className="mb-3 flex items-center gap-3">
                          <span className="text-xs tracking-wide px-3 py-1 bg-purple-50 text-purple-700">
                            recurring
                          </span>
                          {booking.recurrenceGroup.endDate && (
                            <span className="text-xs text-purple-600">
                              until {format(new Date(booking.recurrenceGroup.endDate), 'PPP')}
                            </span>
                          )}
                        </div>
                      )}

                      {booking.description && (
                        <p className="text-sm text-pink-600 mb-4">{booking.description}</p>
                      )}

                      {filter !== 'upcoming' && (
                        <button
                          onClick={() => setExpandedBooking(expandedBooking === booking._id ? null : booking._id)}
                          className="text-sm text-pink-600 hover:text-pink-900 transition-colors"
                        >
                          {expandedBooking === booking._id ? 'hide details' : 'show details'}
                        </button>
                      )}

                      {expandedBooking === booking._id && filter !== 'upcoming' && (
                        <div className="mt-6 pt-6 border-t border-pink-100 space-y-3 text-sm">
                          <div>
                            <span className="text-pink-600">booked by: </span>
                            <span className="text-pink-900">{booking.bookedBy?.name} ({booking.bookedBy?.email})</span>
                          </div>

                          {booking.attendees && booking.attendees.length > 0 && (
                            <div>
                              <span className="text-pink-600">attendees:</span>
                              <div className="mt-1 space-y-1">
                                {booking.attendees.map((attendee) => (
                                  <div key={attendee._id} className="text-pink-900">
                                    {attendee.name} - {attendee.email}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {booking.recurrenceGroup && booking.recurrenceGroup.endDate && (
                            <div>
                              <span className="text-pink-600">recurring until: </span>
                              <span className="text-pink-900">{format(new Date(booking.recurrenceGroup.endDate), 'PPP')}</span>
                            </div>
                          )}

                          {booking.cancellationReason && (
                            <div>
                              <span className="text-pink-600">cancellation reason: </span>
                              <span className="text-pink-900">{booking.cancellationReason}</span>
                            </div>
                          )}

                          <div>
                            <span className="text-pink-600">created: </span>
                            <span className="text-pink-900">{format(new Date(booking.createdAt), 'PPp')}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ml-4 flex gap-2">
                      {canCancelBooking(booking) && (
                        <button
                          onClick={() => openCancelModal(booking)}
                          className="px-4 py-2 border border-red-600 text-sm tracking-wide text-red-600 hover:bg-red-50 transition-colors"
                        >
                          cancel
                        </button>
                      )}
                      {/* Delete button for completed or cancelled bookings (Admin only) */}
                      {isAdmin() && (new Date(booking.endTime) < new Date() || booking.status === 'cancelled') && (
                        <button
                          onClick={() => handleDeleteBooking(booking._id, booking.title)}
                          className="px-3 py-2 bg-red-600 text-white text-sm tracking-wide hover:bg-red-700 transition-colors flex items-center gap-2"
                          title="Delete booking"
                        >
                          <Trash2 className="h-4 w-4" />
                          delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && cancellingBooking && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
            <div className="fixed inset-0 bg-pink-500 bg-opacity-75" onClick={() => setShowCancelModal(false)}></div>

            <div className="relative bg-white shadow-sm max-w-lg w-full p-8">
              <h3 className="text-2xl font-light text-pink-900 mb-4">
                cancel booking
              </h3>
              <p className="text-sm text-pink-600 mb-6">
                are you sure you want to cancel "{cancellingBooking.title}"?
              </p>

              {message.text && (
                <div className={`mb-4 p-3 ${
                  message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm text-pink-700 mb-2">
                  cancellation reason *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400"
                  placeholder="please provide a reason..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCancelBooking}
                  className="flex-1 py-3 bg-red-600 text-white text-sm tracking-wide hover:bg-red-700 transition-colors"
                >
                  confirm cancellation
                </button>
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setMessage({ type: '', text: '' });
                  }}
                  className="flex-1 py-3 border border-pink-200 text-pink-700 text-sm tracking-wide hover:bg-pink-50 transition-colors"
                >
                  close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
