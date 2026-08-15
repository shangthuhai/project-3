import axios from 'axios';

const API_BASE_URL = 'http://localhost:5292/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const getApiUrl = () => API_BASE_URL;

// Auth & Users API
export const getUsers = () => api.get('/users').then(res => res.data);
export const getUser = (id) => api.get(`/users/${id}`).then(res => res.data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data).then(res => res.data);
export const login = (username, password) => api.post('/auth/login', { username, password }).then(res => res.data);
export const register = (data) => api.post('/auth/register', data).then(res => res.data);
export const checkUsername = (username) => api.get(`/users/check-username?username=${username}`).then(res => res.data);
export const checkMobile = (mobile) => api.get(`/users/check-mobile?mobile=${mobile}`).then(res => res.data);

// Contacts API
export const getContacts = (userId) => api.get(`/contacts?userId=${userId}`).then(res => res.data);
export const addContact = (data) => api.post('/contacts', data).then(res => res.data);
export const deleteContact = (id) => api.delete(`/contacts/${id}`).then(res => res.data);

// Friends API
export const getFriends = (userId) => api.get(`/friends?userId=${userId}`).then(res => res.data);
export const getPendingRequests = (userId) => api.get(`/friends/pending?userId=${userId}`).then(res => res.data);
export const sendFriendRequest = (senderId, recipientEmail) => 
  api.post('/friends/request', { senderId, recipientEmail }).then(res => res.data);
export const respondFriendRequest = (connectionId, accept) => 
  api.post('/friends/respond', { connectionId, accept }).then(res => res.data);

// Messages API
export const getChatHistory = (userId, contactNumber) => 
  api.get(`/messages/history?userId=${userId}&contactNumber=${contactNumber}`).then(res => res.data);
export const getQuota = (userId, contactNumber) => 
  api.get(`/messages/quota?userId=${userId}&contactNumber=${contactNumber}`).then(res => res.data);
export const sendMessage = (senderId, receiverNumber, content) => 
  api.post('/messages', { senderId, receiverNumber, content }).then(res => res.data);

// Services API
export const getActivatedServices = (userId) => api.get(`/services?userId=${userId}`).then(res => res.data);
export const activateService = (userId, serviceName, cardNumber, expiryDate, cvv) => 
  api.post('/services/activate', { userId, serviceName, cardNumber, expiryDate, cvv }).then(res => res.data);

export default api;
