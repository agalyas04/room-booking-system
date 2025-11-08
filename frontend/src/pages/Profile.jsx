import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Building, Camera, Check, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    phoneNumber: '',
    profilePicture: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        department: user.department || '',
        phoneNumber: user.phoneNumber || '',
        profilePicture: user.profilePicture || ''
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/auth/profile', formData);
      
      // Update user in context
      setUser(response.data.data);
      
      // Update localStorage
      const existingData = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({
        ...existingData,
        user: response.data.data
      }));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePicture = () => {
    setFormData(prev => ({
      ...prev,
      profilePicture: ''
    }));
  };

  const displayPicture = formData.profilePicture || user?.avatar;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-primary-600 px-6 py-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={displayPicture}
                    alt={user?.name}
                    className="h-24 w-24 rounded-full border-4 border-white bg-white"
                  />
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-1">
                    <Camera className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                  <p className="text-primary-100">{user?.email}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-white text-primary-800 mt-2">
                    {user?.role === 'admin' ? 'Administrator' : 'Employee'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-6">
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="inline h-4 w-4 mr-1" />
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Engineering, Marketing"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., +1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="inline h-4 w-4 mr-1" />
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    name="profilePicture"
                    value={formData.profilePicture}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="https://example.com/your-photo.jpg"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use your auto-generated avatar
                  </p>
                  {formData.profilePicture && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleRemoveProfilePicture}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove custom picture
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Avatar Preview</h3>
                  <div className="flex items-center space-x-4">
                    <img
                      src={displayPicture}
                      alt="Preview"
                      className="h-16 w-16 rounded-full border-2 border-gray-200"
                    />
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>This is how your profile picture will appear</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.profilePicture ? 'Using custom profile picture' : 'Using auto-generated avatar'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
