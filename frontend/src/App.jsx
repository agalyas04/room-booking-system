import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // React Router
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import RoomDetails from './pages/RoomDetails';
import Bookings from './pages/Bookings';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminRooms from './pages/AdminRooms';
import Analytics from './pages/Analytics';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
          <Router>
            <div className="App min-h-screen bg-pink-50 text-pink-900">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/rooms"
                  element={
                    <ProtectedRoute>
                      <Rooms />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/rooms/:id"
                  element={
                    <ProtectedRoute>
                      <RoomDetails />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/profile"
                  element= {
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute adminOnly>
                      <Analytics />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/rooms"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminRooms />
                    </ProtectedRoute>
                  }
                />
                
                <Route path="/" element={<Navigate to="/dashboard" />} />
              </Routes>
              
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </Router>
      </SocketProvider>
    </AuthProvider>
  ) ;
}

export default App;
