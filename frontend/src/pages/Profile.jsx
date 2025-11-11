import { useState, useEffect } from 'react'; // React hooks
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Building, Camera } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const displayPicture = user?.profilePicture || user?.avatar;

  return (
    <div className="min-h-screen bg-pink-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-light text-pink-900 mb-4">
            profile
          </h1>
          <p className="text-lg text-pink-600 font-light">
            your account information
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-12">
        <div className="bg-white shadow-sm">
          {/* Header */}
          <div className="px-8 py-8 border-b border-pink-100">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <img
                  src={displayPicture}
                  alt={user?.name}
                  className="h-24 w-24 rounded-full border border-pink-200 bg-white"
                />
              </div>
              <div>
                <h2 className="text-2xl font-light text-pink-900">{user?.name}</h2>
                <p className="text-pink-600 mt-1">{user?.email}</p>
                <span className="inline-flex items-center px-3 py-1 text-xs tracking-wide bg-pink-100 text-pink-700 mt-2">
                  {user?.role === 'admin' ? 'administrator' : 'employee'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="px-8 py-8">
            <h3 className="text-lg font-light text-pink-900 mb-6">profile information</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-pink-600 mb-2 tracking-wide">
                    full name
                  </label>
                  <div className="w-full px-4 py-3 border border-pink-200 rounded-none bg-pink-50 text-pink-900 text-sm">
                    {user?.name || 'not provided'}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-pink-600 mb-2 tracking-wide">
                    email
                  </label>
                  <div className="w-full px-4 py-3 border border-pink-200 rounded-none bg-pink-50 text-pink-900 text-sm">
                    {user?.email}
                  </div>
                </div>

                {/* Only show department and phone for non-admin users */}
                {user?.role !== 'admin' && (
                  <>
                    <div>
                      <label className="block text-xs text-pink-600 mb-2 tracking-wide">
                        department
                      </label>
                      <div className="w-full px-4 py-3 border border-pink-200 rounded-none bg-pink-50 text-pink-900 text-sm">
                        {user?.department || 'not provided'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-pink-600 mb-2 tracking-wide">
                        phone number
                      </label>
                      <div className="w-full px-4 py-3 border border-pink-200 rounded-none bg-pink-50 text-pink-900 text-sm">
                        {user?.phoneNumber || 'not provided'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
