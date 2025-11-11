import { useState } from 'react'; // React hooks
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DoorOpen } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    
    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-pink-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light text-pink-900 mb-2">
            Room Booking Lite
          </h2>
          <p className="text-sm text-pink-600 tracking-wide">
            create your account
          </p>
        </div>
        
        <div className="bg-white p-10 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm text-pink-700 mb-2">
                full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm text-pink-700 mb-2">
                email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="department" className="block text-sm text-pink-700 mb-2">
                department
              </label>
              <input
                id="department"
                name="department"
                type="text"
                className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm text-pink-700 mb-2">
                phone number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm text-pink-700 mb-2">
                password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-pink-700 mb-2">
                confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 border border-pink-200 rounded-none text-sm focus:outline-none focus:border-gray-400 transition-colors"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-pink-600 text-white text-sm tracking-wide hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? 'creating account...' : 'register'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-pink-600">
              already have an account?{' '}
              <Link to="/login" className="text-pink-900 hover:underline">
                sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
