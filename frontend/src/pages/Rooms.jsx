import { useState, useEffect } from 'react'; // React hooks
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { Users, MapPin, Search, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingRoom, setDeletingRoom] = useState(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms');
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRoom = async (roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingRoom(roomId);
    try {
      await api.delete(`/rooms/${roomId}`);
      toast.success(`Room "${roomName}" deleted successfully`);
      fetchRooms(); // Refresh the list
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete room';
      toast.error(message);
    } finally {
      setDeletingRoom(null);
    }
  };


  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-pink-900 mb-4">
            explore rooms
          </h1>
          <p className="text-lg text-pink-600 font-light">
            find the perfect space for your meeting
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
              placeholder="search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRooms.map((room) => (
              <div key={room._id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <MapPin className="h-12 w-12" />
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-light text-pink-900 mb-2">{room.name}</h3>
                  <p className="text-pink-600 text-sm mb-4">{room.location}</p>
                  
                  <div className="space-y-1 mb-4 text-sm text-pink-600">
                    <p>capacity: {room.capacity} people</p>
                    {room.amenities && room.amenities.length > 0 && (
                      <p>amenities: {room.amenities.slice(0, 2).join(', ')}{room.amenities.length > 2 ? '...' : ''}</p>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/rooms/${room._id}`)}
                    className="w-full py-3 bg-pink-600 text-white text-sm tracking-wide hover:bg-pink-700 transition-colors mb-2"
                  >
                    view & book
                  </button>
                  
                  {isAdmin() && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRemoveRoom(room._id, room.name)}
                        disabled={deletingRoom === room._id}
                        className="flex-1 py-3 border border-red-600 text-red-600 text-sm tracking-wide hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingRoom === room._id ? 'removing...' : 'remove'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredRooms.length === 0 && (
          <div className="text-center py-20">
            <p className="text-pink-600 text-lg font-light">no rooms found</p>
            <p className="text-gray-400 text-sm mt-2">try a different search term</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default Rooms;
