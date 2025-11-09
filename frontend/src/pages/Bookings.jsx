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
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';

const Bookings = () => {
  const { user } = useAuth();
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
      const response = await api.get('/bookings/my-bookings');
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

  const getFilteredBookings = () => {
    const now = new Date();
    
    let filtered = bookings;

    // Filter by time
    if (filter === 'upcoming') {
      filtered = filtered.filter(b => new Date(b.startTime) > now);
    } else if (filter === 'past') {
      filtered = filtered.filter(b => new Date(b.endTime) < now);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    return filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-400" />
              
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        filter === 'all'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilter('upcoming')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        filter === 'upcoming'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Upcoming
                    </button>
                    <button
                      onClick={() => setFilter('past')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        filter === 'past'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Past
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        statusFilter === 'all'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('confirmed')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        statusFilter === 'confirmed'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Confirmed
                    </button>
                    <button
                      onClick={() => setStatusFilter('cancelled')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        statusFilter === 'cancelled'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Cancelled
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'upcoming' ? "You don't have any upcoming bookings." : 
                 filter === 'past' ? "You don't have any past bookings." :
                 "You haven't made any bookings yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.title}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="font-medium">{booking.room?.name}</span>
                            <span className="mx-1">•</span>
                            <span>{booking.room?.location}</span>
                          </div>

                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {format(new Date(booking.startTime), 'PPP')}
                          </div>

                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {format(new Date(booking.startTime), 'p')} - {format(new Date(booking.endTime), 'p')}
                          </div>

                          {booking.attendees && booking.attendees.length > 0 && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-gray-400" />
                              {booking.attendees.length} attendee{booking.attendees.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        {booking.recurrenceGroup && (
                          <div className="mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Recurring Booking
                            </span>
                          </div>
                        )}

                        {booking.description && (
                          <p className="text-sm text-gray-600 mb-3">{booking.description}</p>
                        )}

                        {/* Expandable Details */}
                        <button
                          onClick={() => setExpandedBooking(expandedBooking === booking._id ? null : booking._id)}
                          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          {expandedBooking === booking._id ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show Details
                            </>
                          )}
                        </button>

                        {expandedBooking === booking._id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <dl className="grid grid-cols-1 gap-3 text-sm">
                              <div>
                                <dt className="font-medium text-gray-900">Booked By</dt>
                                <dd className="text-gray-600">{booking.user?.name} ({booking.user?.email})</dd>
                              </div>

                              {booking.attendees && booking.attendees.length > 0 && (
                                <div>
                                  <dt className="font-medium text-gray-900 mb-1">Attendees</dt>
                                  <dd className="space-y-1">
                                    {booking.attendees.map((attendee) => (
                                      <div key={attendee._id} className="text-gray-600">
                                        {attendee.name} - {attendee.email}
                                      </div>
                                    ))}
                                  </dd>
                                </div>
                              )}

                              {booking.cancellationReason && (
                                <div>
                                  <dt className="font-medium text-gray-900">Cancellation Reason</dt>
                                  <dd className="text-gray-600">{booking.cancellationReason}</dd>
                                </div>
                              )}

                              <div>
                                <dt className="font-medium text-gray-900">Created</dt>
                                <dd className="text-gray-600">{format(new Date(booking.createdAt), 'PPp')}</dd>
                              </div>
                            </dl>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="ml-4 flex flex-col space-y-2">
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => openCancelModal(booking)}
                            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Cancel
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
      </div>

      {/* Cancel Modal */}
      {showCancelModal && cancellingBooking && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCancelModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Cancel Booking
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Are you sure you want to cancel "{cancellingBooking.title}"?
                      </p>

                      {message.text && (
                        <div className={`mb-4 p-3 rounded-md ${
                          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                          <p className="text-sm">{message.text}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cancellation Reason *
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Please provide a reason for cancellation..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleCancelBooking}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Confirm Cancellation
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCancelModal(false);
                    setMessage({ type: '', text: '' });
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
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
