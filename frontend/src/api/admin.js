import api from '../utils/api';

// Room Management APIs
export const createRoom = async (roomData) => {
  try {
    const response = await api.post('/rooms', roomData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


export const deleteRoom = async (roomId) => {
  try {
    const response = await api.delete(`/rooms/${roomId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllRooms = async () => {
  try {
    const response = await api.get('/rooms/all');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const toggleRoomStatus = async (roomId, isActive) => {
  try {
    const response = await api.patch(`/rooms/${roomId}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Analytics APIs
export const getAnalytics = async (timeRange = 'week') => {
  try {
    const response = await api.get(`/admin/analytics?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/analytics/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRoomUtilization = async (timeRange = 'week') => {
  try {
    const response = await api.get(`/admin/analytics/rooms?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBookingTrends = async (timeRange = 'week') => {
  try {
    const response = await api.get(`/admin/analytics/trends?timeRange=${timeRange}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
