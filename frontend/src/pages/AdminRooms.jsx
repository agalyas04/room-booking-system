import { useState, useEffect } from 'react'; // React hooks
import Navbar from '../components/Navbar';
import { createRoom, deleteRoom, getAllRooms, toggleRoomStatus } from '../api/admin';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Users, 
  Building,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

const AdminRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
      const response = await getAllRooms();
      setRooms(response.data);
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

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      name: '',
      location: '',
      capacity: '',
      floor: '',
      description: '',
      amenities: '',
      imageUrl: ''
    });
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

      await createRoom(roomData);
      setMessage({ type: 'success', text: 'Room created successfully!' });

      await fetchRooms();
      setTimeout(() => {
        closeModal();
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
      await deleteRoom(id);
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

  const handleToggleRoomStatus = async (room) => {
    try {
      const newStatus = !room.isActive;
      await toggleRoomStatus(room._id, newStatus);
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


  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-8 sm:px-0">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-pink-900 text-pink-900 mb-4">Manage Rooms</h1>
            <p className="text-lg text-pink-600 text-pink-600 mb-8">Create and manage your meeting rooms</p>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-semibold rounded text-white bg-pink-600 hover:bg-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-6 w-6 mr-3" />
              Add New Room
            </button>
          </div>

          {message.text && (
            <div className={`mb-8 p-4 rounded shadow-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center justify-center">
                {message.type === 'success' ? (
                  <Check className="h-5 w-5 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-3" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}


          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <div key={room._id} className="bg-white rounded-lg shadow-sm border border-pink-100 hover:shadow-md transition-all overflow-hidden">
                  {/* Room Header */}
                  <div className="p-6 border-b border-pink-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-pink-900 text-pink-900">
                        {room.name}
                      </h3>
                      {!room.isActive && (
                        <span className="inline-flex items-center px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {/* Room Details */}
                    <div className="space-y-2">
                      <div className="flex items-center text-pink-600 text-pink-600">
                        <MapPin className="h-4 w-4 mr-2 text-pink-500" />
                        <span className="text-sm">{room.location} - Floor {room.floor}</span>
                      </div>
                      <div className="flex items-center text-pink-600 text-pink-600">
                        <Users className="h-4 w-4 mr-2 text-green-500" />
                        <span className="text-sm">Capacity: {room.capacity} people</span>
                      </div>
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="flex items-center text-pink-600 text-pink-600">
                          <Building className="h-4 w-4 mr-2 text-purple-500" />
                          <span className="text-sm">{room.amenities.length} amenities</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Amenities List */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.slice(0, 3).map((amenity, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-pink-100 text-pink-800">
                              {amenity}
                            </span>
                          ))}
                          {room.amenities.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-none text-xs font-medium bg-gray-100 text-pink-600 bg-pink-100 text-pink-700">
                              +{room.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="p-6">
                    <div className="flex items-center justify-between space-x-3">
                      <button
                        onClick={() => handleToggleRoomStatus(room)}
                        className={`flex-1 px-4 py-2 rounded text-sm font-semibold transition-colors ${
                          room.isActive
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {room.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(room._id, room.name)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Room"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-pink-500 bg-opacity-75 transition-opacity" onClick={closeModal}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-pink-900">
Create New Room
                    </h3>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="text-gray-400 hover:text-pink-600"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  {message.text && (
                    <div className={`mb-4 p-3 rounded-none ${
                      message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Room Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-pink-700 mb-1">
                          Location *
                        </label>
                        <input
                          type="text"
                          name="location"
                          required
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-pink-700 mb-1">
                          Floor *
                        </label>
                        <input
                          type="number"
                          name="floor"
                          required
                          min="1"
                          value={formData.floor}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Capacity *
                      </label>
                      <input
                        type="number"
                        name="capacity"
                        required
                        min="1"
                        value={formData.capacity}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Description
                      </label>
                      <textarea
                        name="description"
                        rows={3}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Amenities (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="amenities"
                        value={formData.amenities}
                        onChange={handleInputChange}
                        placeholder="e.g., Projector, Whiteboard, Video Conference"
                        className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-pink-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/room-image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-pink-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-none border border-transparent shadow-sm px-4 py-2 bg-pink-600 text-base font-medium text-white hover:bg-pink-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                  >
Create
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 w-full inline-flex justify-center rounded-none border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-pink-700 hover:bg-pink-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
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
