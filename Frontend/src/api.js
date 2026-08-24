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
export const verify2Fa = (username, code) => api.post('/auth/verify-2fa', { username, code }).then(res => res.data);
export const toggle2Fa = (enabled) => api.post('/users/2fa/toggle', { enabled }).then(res => res.data);
export const togglePrivacy = (enabled) => api.post('/users/privacy/toggle', { enabled }).then(res => res.data);
export const getBlocklist = () => api.get('/users/blocklist').then(res => res.data);
export const blockNumber = (number) => api.post('/users/blocklist', { number }).then(res => res.data);
export const unblockNumber = (id) => api.delete(`/users/blocklist/${id}`).then(res => res.data);

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

// Contact Groups API
export const getGroups = () => api.get('/groups').then(res => res.data);
export const createGroup = (name) => api.post('/groups', { name }).then(res => res.data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then(res => res.data);
export const getGroupMembers = (id) => api.get(`/groups/${id}/members`).then(res => res.data);
export const addGroupMember = (groupId, contactId) => api.post(`/groups/${groupId}/members`, { contactId }).then(res => res.data);
export const removeGroupMember = (groupId, contactId) => api.delete(`/groups/${groupId}/members/${contactId}`).then(res => res.data);

// SMS Templates API
export const getTemplates = () => api.get('/templates').then(res => res.data);
export const createTemplate = (title, body) => api.post('/templates', { title, body }).then(res => res.data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`).then(res => res.data);

// Messages API
export const getChatHistory = (userId, contactNumber) => 
  api.get(`/messages/history?userId=${userId}&contactNumber=${contactNumber}`).then(res => res.data);
export const getQuota = (userId, contactNumber) => 
  api.get(`/messages/quota?userId=${userId}&contactNumber=${contactNumber}`).then(res => res.data);
export const sendMessage = (senderId, receiverNumber, content, scheduledAt) => 
  api.post('/messages', { senderId, receiverNumber, content, scheduledAt }).then(res => res.data);
export const sendBulkMessage = (groupId, content, scheduledAt) => 
  api.post('/messages/bulk', { groupId, content, scheduledAt }).then(res => res.data);

// AI Assistant API
export const generateAiSms = (prompt, tone) => 
  api.post('/ai/generate', { prompt, tone }).then(res => res.data);

// Analytics API
export const getAnalyticsStats = () => api.get('/analytics/dashboard').then(res => res.data);

// Services API
export const getActivatedServices = (userId) => api.get(`/services?userId=${userId}`).then(res => res.data);
export const requestPaymentOtp = () => api.post('/services/request-otp').then(res => res.data);
export const activateService = (userId, serviceName, cardNumber, expiryDate, cvv, otpCode) => 
  api.post('/services/activate', { userId, serviceName, cardNumber, expiryDate, cvv, otpCode }).then(res => res.data);

// Admin API
export const loginAdmin = (username, password) => 
  api.post('/auth/admin/login', { username, password }).then(res => res.data);

export const getAdminStats = () => 
  api.get('/admin/dashboard/stats').then(res => res.data);

export const getAdminUsers = () => 
  api.get('/admin/users').then(res => res.data);

export const updateUserStatus = (id, isActive) => 
  api.put(`/admin/users/${id}/status`, { isActive }).then(res => res.data);

export const updateUserQuota = (id, freeMessagesLeft) => 
  api.put(`/admin/users/${id}/quota`, { freeMessagesLeft }).then(res => res.data);

export const getAdminTransactions = () => 
  api.get('/admin/transactions').then(res => res.data);

export const getAdminSmsLogs = () => 
  api.get('/admin/sms-logs').then(res => res.data);

export const createAdminTemplate = (title, body) => 
  api.post('/admin/templates', { title, body }).then(res => res.data);

export const deleteAdminTemplate = (id) => 
  api.delete(`/admin/templates/${id}`).then(res => res.data);

export const chatWithAdminAi = (message, history) => 
  api.post('/admin/ai-chat', { message, history }).then(res => res.data);

export default api;
