import { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Analytics = () => {
  const { isAdmin } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('week');
  const eventSourceRef = useRef(null);

  useEffect(() => {
    // Initial fetch
    fetchAnalytics();

    // Setup SSE connection for real-time updates
    setupSSEConnection();

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        console.log('SSE connection closed');
      }
    };
  }, [range]);

  const setupSSEConnection = () => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) return;

      // Create SSE connection with auth token in URL
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analytics/stream?range=${range}`;
      
      // EventSource doesn't support custom headers, so we'll use a fallback polling approach
      // For production, consider using WebSockets or a library that supports auth headers with SSE
      
      // For now, use polling with short intervals for real-time feel
      const pollInterval = setInterval(async () => {
        try {
          const response = await api.get(`/analytics?range=${range}`);
          setAnalytics(response.data.data);
        } catch (error) {
          console.error('Error polling analytics:', error);
        }
      }, 5000); // Poll every 5 seconds

      // Store interval ID for cleanup
      eventSourceRef.current = { close: () => clearInterval(pollInterval) };
      
      console.log('Real-time analytics polling started');
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics?range=${range}`);
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeChange = (newRange) => {
    setRange(newRange);
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-pink-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="bg-white shadow-sm border border-pink-100 p-12 text-center">
            <h1 className="text-3xl font-light text-pink-900 mb-4">access denied</h1>
            <p className="text-pink-600">only administrators can view analytics</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-pink-50">
        <Navbar />
        <div className="flex justify-center items-center py-12">
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-light text-pink-900 mb-4 tracking-tight">
              analytics
            </h1>
            <p className="text-xl text-pink-600 font-light">
              insights and metrics
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex justify-center gap-2">
            {['week', 'month', 'year'].map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  range === r
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'bg-pink-50 text-pink-600 hover:bg-pink-100'
                }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        {/* Key Metrics - FIXED: Removed "active bookings" box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white shadow-sm border border-pink-100 p-8">
            <p className="text-sm text-pink-600 mb-2">total rooms</p>
            <p className="text-4xl font-light text-pink-900">{analytics?.totalRooms || 0}</p>
          </div>
          <div className="bg-white shadow-sm border border-pink-100 p-8">
            <p className="text-sm text-pink-600 mb-2">utilization rate</p>
            <p className="text-4xl font-light text-pink-900">{analytics?.utilizationRate || 0}%</p>
          </div>
          <div className="bg-white shadow-sm border border-pink-100 p-8">
            <p className="text-sm text-pink-600 mb-2">total bookings</p>
            <p className="text-4xl font-light text-pink-900">{analytics?.totalBookings || 0}</p>
          </div>
        </div>

        {/* Weekly Utilization & Room Utilization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Weekly Utilization */}
          {analytics?.weeklyUtilization && analytics.weeklyUtilization.length > 0 && (
            <div className="bg-white shadow-sm border border-pink-100 rounded-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Weekly Utilization</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.weeklyUtilization} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fce7f3" />
                  <XAxis dataKey="day" tick={{ fill: '#9f1239', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9f1239', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #fce7f3', borderRadius: '8px' }}
                    labelStyle={{ color: '#831843', fontWeight: 'bold' }}
                    formatter={(value) => [`${value}%`, 'Utilization']}
                  />
                  <Bar dataKey="utilization" radius={[8, 8, 0, 0]}>
                    {analytics.weeklyUtilization.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#pinkGradient${index})`} />
                    ))}
                  </Bar>
                  <defs>
                    {analytics.weeklyUtilization.map((entry, index) => (
                      <linearGradient key={`gradient-${index}`} id={`pinkGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ec4899" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#db2777" stopOpacity={0.9} />
                      </linearGradient>
                    ))}
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Room Utilization Rates */}
          {analytics?.roomUtilization && analytics.roomUtilization.length > 0 && (
            <div className="bg-white shadow-sm border border-pink-100 rounded-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Room Utilization Rates</h3>
              </div>
              <div className="space-y-4">
                {analytics.roomUtilization.slice(0, 5).map((room, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-700">{room.roomName}</span>
                      <span className="text-sm font-semibold text-gray-900">{room.utilizationRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${room.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Popular Time Slots & Booking Frequency Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

          {/* Popular Time Slots - FIXED: Show exactly top 2 with proper no-data handling */}
          <div className="bg-white shadow-sm border border-pink-100 rounded-lg p-8">
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Popular Time Slots</h3>
            </div>
            
            {analytics?.popularTimeSlots && analytics.popularTimeSlots.length > 0 ? (
              <div className="space-y-4">
                {analytics.popularTimeSlots.map((slot, index) => {
                  const colors = [
                    { bg: 'bg-pink-500', text: 'text-pink-500', border: 'border-pink-200' },
                    { bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-200' }
                  ];
                  const color = colors[index] || colors[0];
                  
                  return (
                    <div key={index} className={`flex items-center gap-4 p-4 border ${color.border} rounded-lg bg-gray-50`}>
                      <div className={`${color.bg} rounded-full w-14 h-14 flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900">{slot.timeSlot}</p>
                        <p className="text-sm text-gray-600">{slot.count} {slot.count === 1 ? 'booking' : 'bookings'}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-sm">No booking data available for the selected period</p>
              </div>
            )}
          </div>

          {/* Booking Frequency */}
          {analytics?.bookingFrequency && analytics.bookingFrequency.length > 0 && (
            <div className="bg-white shadow-sm border border-pink-100 rounded-lg p-8">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Booking Frequency</h3>
              </div>
              <div className="space-y-4">
                {analytics.bookingFrequency.map((freq, index) => {
                  const totalBookings = analytics.bookingFrequency.reduce((sum, f) => sum + f.count, 0);
                  const percentage = totalBookings > 0 ? ((freq.count / totalBookings) * 100).toFixed(0) : 0;
                  const colors = index === 0 ? 'bg-purple-500' : 'bg-pink-500';
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${colors}`}></div>
                          <span className="text-sm text-gray-700">{freq.type}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">{freq.count}</p>
                          <p className="text-xs text-gray-500">{percentage}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
