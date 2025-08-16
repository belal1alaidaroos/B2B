import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7160';
const API_KEY = import.meta.env.VITE_API_KEY;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Authorization': `Bearer ${API_KEY}` })
  },
  timeout: 30000, // Increased timeout for local development
  // Allow self-signed certificates in development
  validateStatus: function (status) {
    return status < 500; // Accept any status code less than 500
  }
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      console.warn('Authentication token expired or invalid');
      // Redirect to login or refresh token
    }
    
    // Enhanced error logging for debugging
    const errorInfo = {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      message: error.message
    };
    
    console.error('API Error Details:', errorInfo);
    
    // Handle CORS and connection errors for local development
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Network Error: Check if the backend server is running on', API_BASE_URL);
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

  // Entity-specific methods (mapped to backend's EntityController)
  getAll: (entityType) => apiClient.get(`/api/entity/${entityType}`),
  getById: (entityType, id) => apiClient.get(`/api/entity/${entityType}/${id}`),
  create: (entityType, data) => apiClient.post(`/api/entity/${entityType}`, data),
  update: (entityType, id, data) => apiClient.put(`/api/entity/${entityType}/${id}`, data),
  deleteById: (entityType, id) => apiClient.delete(`/api/entity/${entityType}/${id}`),

  // Authentication methods (mapped to backend's AuthController)
  auth: {
    login: (credentials) => apiClient.post('/api/auth/login', credentials),
    logout: () => apiClient.post('/api/auth/logout'),
    register: (userData) => apiClient.post('/api/auth/register', userData),
    refreshToken: () => apiClient.post('/api/auth/refresh-token'),
    getProfile: () => apiClient.get('/api/auth/me'), // Backend uses /me instead of /profile
    updateProfile: (data) => apiClient.put('/api/auth/me', data),
    changePassword: (data) => apiClient.post('/api/auth/change-password', data),
    validateToken: () => apiClient.post('/api/auth/validate-token')
  },

  // Integration methods (mapped to backend's IntegrationsController)
  integrations: {
    core: {
      invokeLLM: (data) => apiClient.post('/api/integrations/core/invoke-llm', data),
      sendEmail: (data) => apiClient.post('/api/integrations/core/send-email', data),
      uploadFile: (formData) => apiClient.post('/api/integrations/core/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }),
      generateImage: (data) => apiClient.post('/api/integrations/core/generate-image', data),
      extractData: (data) => apiClient.post('/api/integrations/core/extract-data', data),
      sendTemplateEmail: (data) => apiClient.post('/api/integrations/core/send-template-email', data)
    },
    downloadFile: (fileUrl) => apiClient.get(`/api/integrations/files/download?fileUrl=${encodeURIComponent(fileUrl)}`),
    createNotification: (data) => apiClient.post('/api/integrations/notifications', data)
  },

  // Entity filtering and listing with backend-compatible parameters
  filterEntities: (entityType, filters = {}) => {
    const request = {
      filters: filters,
      page: filters.page || 1,
      pageSize: filters.pageSize || 50,
      sortBy: filters.sortBy || null,
      sortDirection: filters.sortDirection || 'asc'
    };
    return apiClient.post(`/api/entity/${entityType}/filter`, request);
  }
};

export default api;