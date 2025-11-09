import { useState, useEffect } from 'react'; // React hooks
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Clock, 
  ArrowLeft,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [allUsers, setAllUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    attendees: [],
    isRecurring: false,
    recurrenceEndDate: ''
  });

  useEffect(() => {
    fetchRoomDetails();
    fetchUsers();
  }, [id]);

  useEffect(() => {
    if (socket && room) {
      socket.emit('join-room', room._id);
      
      socket.on('booking-created', handleBookingUpdate);
      socket.on('booking-updated', handleBookingUpdate);
      socket.on('booking-cancelled', handleBookingUpdate);

      return () => {
        socket.emit('leave-room', room._id);
        socket.off('booking-created', handleBookingUpdate);
        socket.off('booking-updated', handleBookingUpdate);
        socket.off('booking-cancelled', handleBookingUpdate);
      };
    }
  }, [socket, room]);

  const handleBookingUpdate = () => {
    fetchRoomDetails();
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await api.get(`/rooms/${id}`);
      setRoom(response.data.data);
    } catch (error) {
      console.error('Error fetching room details:', error);
      setMessage({ type: 'error', text: 'Failed to load room details' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/users');
      setAllUsers(response.data.data.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAttendeeToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(userId)
        ? prev.attendees.filter(id => id !== userId)
        : [...prev.attendees, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setMessage({ type: '', text: '' });

    // Client-side validation
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      setBookingLoading(false);
      return;
    }

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
    const now = new Date();

    // Validate dates are valid
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setMessage({ type: 'error', text: 'Invalid date or time format' });
      setBookingLoading(false);
      return;
    }

    // Validate start time is in the future
    if (startDateTime < now) {
      setMessage({ type: 'error', text: 'Start time must be in the future' });
      setBookingLoading(false);
      return;
    }

    // Validate end time is after start time
    if (endDateTime <= startDateTime) {
      setMessage({ type: 'error', text: 'End time must be after start time' });
      setBookingLoading(false);
      return;
    }

    // Validate recurring booking end date
    if (formData.isRecurring) {
      if (!formData.recurrenceEndDate) {
        setMessage({ type: 'error', text: 'Please specify recurrence end date' });
        setBookingLoading(false);
        return;
      }
      
      const recurrenceEnd = new Date(formData.recurrenceEndDate);
      if (recurrenceEnd <= new Date(formData.date)) {
        setMessage({ type: 'error', text: 'Recurrence end date must be after the start date' });
        setBookingLoading(false);
        return;
      }
    }

    try {
      const bookingData = {
        room: id,
        title: formData.title,
        description: formData.description,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        attendees: formData.attendees
      };

      // Add recurring booking fields if needed
      if (formData.isRecurring) {
        bookingData.isRecurring = true;
        bookingData.recurrenceEndDate = formData.recurrenceEndDate;
      }

      const response = await api.post('/bookings', bookingData);
      
      if (formData.isRecurring) {
        const result = response.data.data;
        setMessage({ 
          type: 'success', 
          text: `Created ${result.createdBookings} recurring booking(s). ${result.failedDates > 0 ? `${result.failedDates} booking(s) skipped due to conflicts.` : ''}`
        });
      } else {
        setMessage({ type: 'success', text: 'Booking created successfully!' });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        attendees: [],
        isRecurring: false,
        recurrenceEndDate: ''
      });

      setTimeout(() => {
        navigate('/bookings');
      }, 2000);

    } catch (error) {
      console.error('Booking error:', error.response?.data);
      
      let errorMessage = 'Failed to create booking';
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        errorMessage = error.response.data.errors.map(err => err.message).join(', ');
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSelectedDateBookings = () => {
    if (!room || !room.bookings) return [];
    
    // Use selected date from form, fallback to today if no date selected
    const selectedDate = formData.date || new Date().toISOString().split('T')[0];
    
    return room.bookings.filter(booking => {
      const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
      return bookingDate === selectedDate && booking.status === 'confirmed';
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  };

  const getScheduleTitle = () => {
    if (!formData.date) return "Today's Schedule";
    
    const selectedDateStr = formData.date; // YYYY-MM-DD format
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (selectedDateStr === todayStr) {
      return "Today's Schedule";
    } else {
      const selectedDate = new Date(formData.date + 'T00:00:00'); // Avoid timezone issues
      return `Schedule for ${selectedDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">Room not found</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedDateBookings = getSelectedDateBookings();
  const minDate = new Date().toISOString().split('T')[0];
  const maxDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <button
            onClick={() => navigate('/rooms')}
            className="mb-6 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rooms
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Room Details */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                {room.imageUrl && (
                  <img
                    src={room.imageUrl}
                    alt={room.name}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">{room.name}</h1>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{room.location} - Floor {room.floor}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 mr-2" />
                      <span>Capacity: {room.capacity} people</span>
                    </div>
                  </div>

                  {room.description && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-600">{room.description}</p>
                    </div>
                  )}

                  {room.amenities && room.amenities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-primary-100 text-primary-800"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected Date Schedule */}
                  <div key={formData.date || 'today'} className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{getScheduleTitle()}</h3>
                    {selectedDateBookings.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        {formData.date ? 'No bookings on selected date' : 'No bookings today'}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateBookings.map((booking) => (
                          <div key={booking._id} className="text-sm p-2 bg-gray-50 rounded">
                            <div className="font-medium text-gray-900">{booking.title}</div>
                            <div className="text-gray-600 flex items-center mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(new Date(booking.startTime).toTimeString().slice(0, 5))} - 
                              {formatTime(new Date(booking.endTime).toTimeString().slice(0, 5))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Book This Room</h2>

                {message.text && (
                  <div className={`mb-6 p-4 rounded-md ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <div className="flex">
                      {message.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 mr-2" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-2" />
                      )}
                      <span>{message.text}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Team Standup"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Meeting agenda or notes..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        required
                        min={minDate}
                        max={maxDate}
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time *
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        required
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        name="isRecurring"
                        id="isRecurring"
                        checked={formData.isRecurring}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                        Recurring booking (Weekly)
                      </label>
                    </div>

                    {formData.isRecurring && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recurrence End Date *
                        </label>
                        <input
                          type="date"
                          name="recurrenceEndDate"
                          required={formData.isRecurring}
                          min={formData.date || minDate}
                          max={maxDate}
                          value={formData.recurrenceEndDate}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attendees (Optional)
                    </label>
                    <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
                      {allUsers.length === 0 ? (
                        <p className="text-sm text-gray-500">No other users available</p>
                      ) : (
                        allUsers.map((u) => (
                          <label key={u._id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.attendees.includes(u._id)}
                              onChange={() => handleAttendeeToggle(u._id)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <img
                              src={u.profilePicture || u.avatar}
                              alt={u.name}
                              className="h-8 w-8 rounded-full border border-gray-200"
                            />
                            <span className="text-sm text-gray-700 flex-1">
                              <span className="font-medium">{u.name}</span>
                              <span className="text-gray-500"> ({u.email})</span>
                              {u.department && <span className="text-gray-500"> - {u.department}</span>}
                            </span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => navigate('/rooms')}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bookingLoading ? 'Creating...' : 'Create Booking'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
