import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  MapPin, 
  Users, 
  Building,
  Search,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    floor: '',
    description: '',
    amenities: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/rooms/all');
      setRooms(response.data.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      location: '',
      capacity: '',
      floor: '',
      description: '',
      amenities: '',
      imageUrl: ''
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const openEditModal = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      location: room.location,
      capacity: room.capacity.toString(),
      floor: room.floor.toString(),
      description: room.description || '',
      amenities: room.amenities ? room.amenities.join(', ') : '',
      imageUrl: room.imageUrl || ''
    });
    setShowModal(true);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      const roomData = {
        name: formData.name,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        floor: parseInt(formData.floor),
        description: formData.description,
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        imageUrl: formData.imageUrl
      };

      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, roomData);
        setMessage({ type: 'success', text: 'Room updated successfully!' });
      } else {
        await api.post('/rooms', roomData);
        setMessage({ type: 'success', text: 'Room created successfully!' });
      }

      await fetchRooms();
      setTimeout(() => {
        setShowModal(false);
        setMessage({ type: '', text: '' });
      }, 1500);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save room'
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.delete(`/rooms/${id}`);
      await fetchRooms();
      setMessage({ type: 'success', text: 'Room deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to delete room'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const toggleRoomStatus = async (room) => {
    try {
      const newStatus = !room.isActive;
      await api.patch(`/rooms/${room._id}/status`, { isActive: newStatus });
      await fetchRooms();
      setMessage({ 
        type: 'success', 
        text: `Room ${newStatus ? 'activated' : 'deactivated'} successfully!` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update room status'
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Manage Rooms</h1>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Room
            </button>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <div className="flex">
                {message.type === 'success' ? (
                  <Check className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <span>{message.text}</span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <li key={room._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {room.name}
                            {!room.isActive && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                Inactive
                              </span>
                            )}
                          </h3>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {room.location} - Floor {room.floor}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Capacity: {room.capacity}
                          </div>
                          {room.amenities && room.amenities.length > 0 && (
                            <div className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {room.amenities.length} amenities
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 flex items-center space-x-2">
                        <button
                          onClick={() => toggleRoomStatus(room)}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            room.isActive
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {room.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(room._id, room.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {editingRoom ? 'Edit Room' : 'Create New Room'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {message.text && (
                    <div className={`mb-4 p-3 rounded-md ${
                      message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          required
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Floor *
                        </label>
                        <input
                          type="number"
                          name="floor"
                          required
                          min="1"
                          value={formData.floor}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        required
                        min="1"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amenities (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleInputChange}
                        placeholder="e.g., Projector, Whiteboard, Video Conference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/room-image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {editingRoom ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRooms;
