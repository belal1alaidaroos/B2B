import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.base44.com';
const API_KEY = import.meta.env.VITE_API_KEY;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
  },
  timeout: 10000
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Redirect to login or refresh token
    }
    return Promise.reject(error);
  }
);

// Generic API methods
export const api = {
  // Generic CRUD operations
  get: (endpoint) => apiClient.get(endpoint),
  post: (endpoint, data) => apiClient.post(endpoint, data),
  put: (endpoint, data) => apiClient.put(endpoint, data),
  delete: (endpoint) => apiClient.delete(endpoint),
  patch: (endpoint, data) => apiClient.patch(endpoint, data),

  // Entity-specific methods
  getAll: (entityType) => apiClient.get(`/${entityType}`),
  getById: (entityType, id) => apiClient.get(`/${entityType}/${id}`),
  create: (entityType, data) => apiClient.post(`/${entityType}`, data),
  update: (entityType, id, data) => apiClient.put(`/${entityType}/${id}`, data),
  deleteById: (entityType, id) => apiClient.delete(`/${entityType}/${id}`),

  // Authentication methods
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    register: (userData) => apiClient.post('/auth/register', userData),
    refreshToken: () => apiClient.post('/auth/refresh'),
    getProfile: () => apiClient.get('/auth/profile'),
    updateProfile: (data) => apiClient.put('/auth/profile', data)
  }
};

export default api;