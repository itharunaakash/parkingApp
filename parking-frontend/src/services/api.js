import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// const API_BASE_URL = 'http://10.0.2.2:5001/api'; 
const API_BASE_URL = 'http://localhost:5001/api';
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  mfaSetup: () => api.post('/auth/mfa/setup'),
  mfaVerifySetup: (token) => api.post('/auth/mfa/verify-setup', { token }),
  mfaVerify: (tempToken, code) => api.post('/auth/mfa/verify', { tempToken, code }),
};
export const bookingAPI = {
  search: (params) => api.get('/bookings/search', { params }).catch(error => {
    console.error('Error searching parking lots:', error.response?.data || error);
    throw error;
  }),
  create: (bookingData) => api.post('/bookings', bookingData).catch(error => {
    console.error('Error creating booking:', error.response?.data || error);
    throw error;
  }),
  getMyBookings: (params) => api.get('/bookings/my-bookings', { params }).catch(error => {
    console.error('Error getting bookings:', error.response?.data || error);
    throw error;
  }),
  cancel: async (id) => {
    try {
      console.log('Sending cancel request for booking:', id);
      const response = await api.post(`/bookings/${id}/cancel`);
      console.log('Cancel response:', response.data);
      return response;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },
  getWaitingList: () => api.get('/bookings/waiting-list').catch(error => {
    console.error('Error getting waiting list:', error.response?.data || error);
    throw error;
  }),
};
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify-payment', data),
  getHistory: () => api.get('/payments/history'),
  refund: (bookingId, reason) => api.post('/payments/refund', { bookingId, reason }),
  dummyPayment: (bookingId, amount) => api.post('/payments/dummy-payment', { bookingId, amount }),
  testPayment: (bookingId, amount) => api.post('/payments/test-payment', { bookingId, amount }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getLocations: () => api.get('/admin/locations').catch(error => {
    console.error('Error fetching locations:', error);
    throw error;
  }),
  createLocation: (locationData) => api.post('/admin/locations', locationData).catch(error => {
    console.error('Error creating location:', error.response?.data || error);
    throw error;
  }),
  updateLocation: (id, locationData) => api.put(`/admin/locations/${id}`, locationData).catch(error => {
    console.error('Error updating location:', error.response?.data || error);
    throw error;
  }),
  deleteLocation: (id) => api.delete(`/admin/locations/${id}`).catch(error => {
    console.error('Error deleting location:', error.response?.data || error);
    throw error;
  }),
  getParkingLots: () => api.get('/admin/parking-lots').catch(error => {
    console.error('Error fetching parking lots:', error);
    throw error;
  }),
  createParkingLot: (lotData) => api.post('/admin/parking-lots', lotData).catch(error => {
    console.error('Error creating parking lot:', error.response?.data || error);
    throw error;
  }),
  updateParkingLot: (id, lotData) => api.put(`/admin/parking-lots/${id}`, lotData).catch(error => {
    console.error('Error updating parking lot:', error.response?.data || error);
    throw error;
  }),
  deleteParkingLot: (id) => api.delete(`/admin/parking-lots/${id}`).catch(error => {
    console.error('Error deleting parking lot:', error.response?.data || error);
    throw error;
  }),
  getBookings: (params) => api.get('/admin/bookings', { params }),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }).catch(error => {
    console.error('Error updating booking status:', error.response?.data || error);
    throw error;
  }),
};
export default api;
