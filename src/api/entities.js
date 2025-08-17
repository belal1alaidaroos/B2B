import { api } from './apiClient';

// Entity classes that provide CRUD operations for each entity type
class EntityBase {
  constructor(backendEntityName) {
    this.backendEntityName = backendEntityName; // What the backend expects
  }

  // Original SDK compatible methods - updated to use backend routes
  async list(sort = null, limit = null) {
    let endpoint = `/api/entity/${this.backendEntityName}`;
    const params = new URLSearchParams();
    
    if (sort) {
      // Handle sort parameter - backend expects 'sort' query param
      params.append('sort', sort);
    }
    if (limit) {
      params.append('pageSize', limit.toString());
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await api.get(endpoint);
    // Backend returns: { success: true, data: { items: [...], totalCount, etc. } }
    // Extract just the items array for frontend compatibility
    if (response.data?.success && response.data?.data?.items) {
      return response.data.data.items;
    }
    return response.data;
  }

  async filter(filters = {}, sort = null, limit = null) {
    // Use the backend's filter endpoint
    const request = {
      filters: Object.entries(filters).map(([key, value]) => ({
        property: key,
        operator: 'equals', // Default operator
        value: value
      })),
      page: 1,
      pageSize: limit || 50,
      sortBy: sort?.replace('-', ''), // Remove '-' prefix if present
      sortDirection: sort?.startsWith('-') ? 'desc' : 'asc'
    };
    
    const response = await api.post(`/api/entity/${this.backendEntityName}/filter`, request);
    // Backend returns: { success: true, data: { items: [...], totalCount, etc. } }
    // Extract just the items array for frontend compatibility
    if (response.data?.success && response.data?.data?.items) {
      return response.data.data.items;
    }
    return response.data;
  }

  async get(id) {
    const response = await api.get(`/api/entity/${this.backendEntityName}/${id}`);
    // Backend returns: { success: true, data: {...} } for individual entities
    // Extract just the entity data for frontend compatibility
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  async find(filters = {}) {
    const results = await this.filter(filters);
    return results && results.length > 0 ? results[0] : null;
  }

  async create(data) {
    const response = await api.post(`/api/entity/${this.backendEntityName}`, data);
    // Backend returns: { success: true, data: {...} }
    // Extract just the entity data for frontend compatibility
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  async update(id, data) {
    const response = await api.put(`/api/entity/${this.backendEntityName}/${id}`, data);
    // Backend returns: { success: true, data: {...} }
    // Extract just the entity data for frontend compatibility
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  }

  async delete(id) {
    const response = await api.delete(`/api/entity/${this.backendEntityName}/${id}`);
    // Backend returns: { success: true, data: null, message: "..." }
    // For delete, we can return the success status or the original response
    if (response.data?.success) {
      return { success: true };
    }
    return response.data;
  }

  async search(query) {
    // Use filter with a search-like approach
    const response = await api.get(`/api/entity/${this.backendEntityName}?filter=${encodeURIComponent(query)}`);
    // Backend returns: { success: true, data: { items: [...] } }
    // Extract just the items array for frontend compatibility
    if (response.data?.success && response.data?.data?.items) {
      return response.data.data.items;
    }
    return response.data;
  }

  // New generic CRUD methods
  async getAll(params = {}) {
    return this.list();
  }

  async getById(id) {
    return this.get(id);
  }
}

// Create entity instances with correct backend entity names
export const Lead = new EntityBase('lead');
export const Quote = new EntityBase('quote');
export const Communication = new EntityBase('communication');
export const JobProfile = new EntityBase('jobprofile'); // Backend uses 'jobprofile' (lowercase, no dash)
export const Account = new EntityBase('account');
export const Contact = new EntityBase('contact');
export const SystemSetting = new EntityBase('systemsetting'); // Backend uses 'systemsetting'
export const Permission = new EntityBase('permission'); // Note: Check if this exists in backend
export const Role = new EntityBase('role');
export const LayoutTemplate = new EntityBase('layouttemplate'); // Note: Check if this exists in backend
export const Job = new EntityBase('job');
export const Country = new EntityBase('country');
export const City = new EntityBase('city');
export const Territory = new EntityBase('territory');
export const Branch = new EntityBase('branch');
export const Department = new EntityBase('department');
export const CostComponent = new EntityBase('costcomponent'); // Backend uses 'costcomponent'
export const PricingRule = new EntityBase('pricingrule'); // Backend uses 'pricingrule'
export const Nationality = new EntityBase('nationality');
export const PriceRequest = new EntityBase('pricerequest'); // Backend uses 'pricerequest'
export const SkillLevel = new EntityBase('skilllevel'); // Backend uses 'skilllevel'
export const DiscountApprovalMatrix = new EntityBase('discountapprovalmatrix'); // Backend uses 'discountapprovalmatrix'
export const Notification = new EntityBase('notification');
export const CustomerInteraction = new EntityBase('customerinteraction'); // Backend uses 'customerinteraction'
export const CustomerResponseTemplate = new EntityBase('customerresponsetemplate'); // Backend uses 'customerresponsetemplate'
export const Opportunity = new EntityBase('opportunity');
export const Task = new EntityBase('task');
export const Contract = new EntityBase('contract');
export const SalesMaterial = new EntityBase('salesmaterial'); // Backend uses 'salesmaterial'
export const AuditLog = new EntityBase('auditlog'); // Backend uses 'auditlog'

// User authentication and management with special methods
export const User = {
  // Authentication methods
  async login(credentials) {
    const response = await api.auth.login(credentials);
    console.log('Login response:', response.data); // Debug logging
    
    // Backend returns: { success: true, data: { token, user } }
    // We need to access response.data.data.token
    if (response.data?.success && response.data?.data?.token) {
      localStorage.setItem('authToken', response.data.data.token);
      console.log('Token stored:', response.data.data.token);
    } else {
      console.error('No token in login response:', response.data);
    }
    return response.data;
  },

  async logout() {
    try {
      const response = await api.auth.logout();
      localStorage.removeItem('authToken');
      return response.data;
    } catch (error) {
      // Even if logout fails on server, remove local token
      localStorage.removeItem('authToken');
      throw error;
    }
  },

  async register(userData) {
    const response = await api.auth.register(userData);
    return response.data;
  },

  async me() {
    const response = await api.auth.getProfile(); // This calls /api/auth/me
    // Backend returns: { success: true, data: { user data } }
    return response.data?.success ? response.data.data : response.data;
  },

  async getProfile() {
    const response = await api.auth.getProfile(); // This calls /api/auth/me
    // Backend returns: { success: true, data: { user data } }
    return response.data?.success ? response.data.data : response.data;
  },

  async updateProfile(data) {
    const response = await api.auth.updateProfile(data);
    return response.data;
  },

  async refreshToken() {
    const response = await api.auth.refreshToken();
    // Handle the same nested structure for refresh token
    if (response.data?.success && response.data?.data?.token) {
      localStorage.setItem('authToken', response.data.data.token);
    }
    return response.data;
  },

  // User management methods (using the entity endpoint for user CRUD)
  async list(sort = null, limit = null) {
    let endpoint = '/api/entity/user'; // Backend expects 'user' not 'users'
    const params = new URLSearchParams();
    
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('pageSize', limit.toString());
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await api.get(endpoint);
    // Backend returns: { success: true, data: { items: [...] } }
    // Extract just the items array for frontend compatibility
    if (response.data?.success && response.data?.data?.items) {
      return response.data.data.items;
    }
    return response.data;
  },

  async filter(filters = {}, sort = null, limit = null) {
    const request = {
      filters: Object.entries(filters).map(([key, value]) => ({
        property: key,
        operator: 'equals',
        value: value
      })),
      page: 1,
      pageSize: limit || 50,
      sortBy: sort?.replace('-', ''),
      sortDirection: sort?.startsWith('-') ? 'desc' : 'asc'
    };
    
    const response = await api.post('/api/entity/user/filter', request);
    // Backend returns: { success: true, data: { items: [...] } }
    // Extract just the items array for frontend compatibility
    if (response.data?.success && response.data?.data?.items) {
      return response.data.data.items;
    }
    return response.data;
  },

  async get(id) {
    const response = await api.get(`/api/entity/user/${id}`);
    // Backend returns: { success: true, data: {...} } for individual entities
    // Extract just the entity data for frontend compatibility
    if (response.data?.success && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },

  async find(filters = {}) {
    const results = await this.filter(filters);
    return results && results.length > 0 ? results[0] : null;
  },

  async create(data) {
    const response = await api.post('/api/entity/user', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/api/entity/user/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/api/entity/user/${id}`);
    return response.data;
  }
};