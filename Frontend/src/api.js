import axios from 'axios';

const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
  ? `${window.location.protocol}//${window.location.host}/api`
  : 'http://localhost:5292/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token and language preference
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  const lang = localStorage.getItem('language') || 'en';
  config.headers['Accept-Language'] = lang;
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
export const loginWithGoogle = (idToken) => api.post('/auth/google', { idToken }).then(res => res.data);
export const checkUsername = (username) => api.get(`/users/check-username?username=${username}`).then(res => res.data);
export const checkMobile = (mobile) => api.get(`/users/check-mobile?mobile=${mobile}`).then(res => res.data);
export const checkEmail = (email) => api.get(`/users/check-email?email=${encodeURIComponent(email)}`).then(res => res.data);
export const sendRegisterOtp = (email) => api.post('/auth/send-register-otp', { email }).then(res => res.data);
export const verify2Fa = (username, code) => api.post('/auth/verify-2fa', { username, code }).then(res => res.data);
export const toggle2Fa = (enabled) => api.post('/users/2fa/toggle', { enabled }).then(res => res.data);
export const togglePrivacy = (enabled) => api.post('/users/privacy/toggle', { enabled }).then(res => res.data);
export const getBlocklist = () => api.get('/users/blocklist').then(res => res.data);
export const blockNumber = (number) => api.post('/users/blocklist', { number }).then(res => res.data);
export const unblockNumber = (id) => api.delete(`/users/blocklist/${id}`).then(res => res.data);
export const unblockNumberByPhone = (number) => api.delete(`/users/blocklist/by-number/${number}`).then(res => res.data);

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
export const searchUsers = (query, page = 1, pageSize = 10) => 
  api.get(`/friends/search?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`).then(res => res.data);

// Contact Groups API
export const getGroups = () => api.get('/groups').then(res => res.data);
export const createGroup = (name) => api.post('/groups', { name }).then(res => res.data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`).then(res => res.data);
export const getGroupMembers = (id) => api.get(`/groups/${id}/members`).then(res => res.data);
export const addGroupMember = (groupId, memberData) => 
  api.post(`/groups/${groupId}/members`, typeof memberData === 'object' ? memberData : { contactId: memberData }).then(res => res.data);
export const removeGroupMember = (groupId, contactId) => api.delete(`/groups/${groupId}/members/${contactId}`).then(res => res.data);

// SMS Templates API
export const getTemplates = () => api.get('/templates').then(res => res.data);
export const createTemplate = (title, body) => api.post('/templates', { title, body }).then(res => res.data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`).then(res => res.data);

// Messages API
export const getChatHistory = (userId, contactNumber, before = null, limit = 20) => {
  let url = `/messages/history?userId=${userId}&contactNumber=${contactNumber}&limit=${limit}`;
  if (before) {
    url += `&before=${encodeURIComponent(before)}`;
  }
  return api.get(url).then(res => res.data);
};
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

export const getAdminUsers = (page = 1, pageSize = 10, search = '', status = '', quota = '', sortBy = '') => {
  let url = `/admin/users?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (quota) url += `&quota=${encodeURIComponent(quota)}`;
  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  return api.get(url).then(res => res.data);
};

export const updateUserStatus = (id, isActive) => 
  api.put(`/admin/users/${id}/status`, { isActive }).then(res => res.data);

export const updateUserQuota = (id, freeMessagesLeft) => 
  api.put(`/admin/users/${id}/quota`, { freeMessagesLeft }).then(res => res.data);

export const getAdminTransactions = (page = 1, pageSize = 10, search = '', service = '', status = '', sortBy = '') => {
  let url = `/admin/transactions?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (service) url += `&service=${encodeURIComponent(service)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  return api.get(url).then(res => res.data);
};

export const getAdminSmsLogs = (page = 1, pageSize = 10, search = '', status = '', type = '') => {
  let url = `/admin/sms-logs?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (type) url += `&type=${encodeURIComponent(type)}`;
  return api.get(url).then(res => res.data);
};

export const getAdminTemplates = (page = 1, pageSize = 10, search = '', sortBy = '') => {
  let url = `/admin/templates?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (sortBy) url += `&sortBy=${encodeURIComponent(sortBy)}`;
  return api.get(url).then(res => res.data);
};

export const createAdminTemplate = (title, body) => 
  api.post('/admin/templates', { title, body }).then(res => res.data);

export const deleteAdminTemplate = (id) => 
  api.delete(`/admin/templates/${id}`).then(res => res.data);

export const chatWithAdminAi = (message, history) => 
  api.post('/admin/ai-chat', { message, history }).then(res => res.data);

export const reportTyping = (receiverNumber) => 
  api.post('/messages/typing', { receiverNumber }).then(res => res.data);

export const getTypingStatus = (contactNumber) => 
  api.get(`/messages/typing-status?contactNumber=${contactNumber}`).then(res => res.data);

export const getConversations = () => 
  api.get('/messages/conversations').then(res => res.data);

// --- Admin Moderation & Keyword Rules ---
export const getAdminKeywords = (page = 1, pageSize = 10, search = '') => {
  let url = `/admin/keywords?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  return api.get(url).then(res => res.data);
};

export const createAdminKeyword = (keyword, category, action) =>
  api.post('/admin/keywords', { keyword, category, action }).then(res => res.data);

export const toggleAdminKeyword = (id) =>
  api.put(`/admin/keywords/${id}/toggle`).then(res => res.data);

export const deleteAdminKeyword = (id) =>
  api.delete(`/admin/keywords/${id}`).then(res => res.data);

export const getAdminModerationLogs = (page = 1, pageSize = 10, search = '', status = '') => {
  let url = `/admin/moderation/logs?page=${page}&pageSize=${pageSize}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (status) url += `&status=${encodeURIComponent(status)}`;
  return api.get(url).then(res => res.data);
};

export const seed15DaysData = () =>
  api.post('/admin/seed-15days-data').then(res => res.data);

export const createFriendUsers = () =>
  api.post('/admin/create-friend-users').then(res => res.data);

export const createStrangerUsers = () =>
  api.post('/admin/create-stranger-users').then(res => res.data);

export default api;
