import { api } from './apiClient';

// Entity classes that provide CRUD operations for each entity type
class EntityBase {
  constructor(entityType) {
    this.entityType = entityType;
  }

  // Original SDK compatible methods
  async list(sort = null, limit = null) {
    let endpoint = `/${this.entityType}`;
    const params = new URLSearchParams();
    
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('limit', limit);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  }

  async filter(filters = {}, sort = null, limit = null) {
    let endpoint = `/${this.entityType}`;
    const params = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('limit', limit);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  }

  async get(id) {
    const response = await api.getById(this.entityType, id);
    return response.data;
  }

  async find(filters = {}) {
    const results = await this.filter(filters);
    return results && results.length > 0 ? results[0] : null;
  }

  async create(data) {
    const response = await api.create(this.entityType, data);
    return response.data;
  }

  async update(id, data) {
    const response = await api.update(this.entityType, id, data);
    return response.data;
  }

  async delete(id) {
    const response = await api.deleteById(this.entityType, id);
    return response.data;
  }

  async search(query) {
    const response = await api.get(`/${this.entityType}/search?q=${encodeURIComponent(query)}`);
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

// Create entity instances
export const Lead = new EntityBase('leads');
export const Quote = new EntityBase('quotes');
export const Communication = new EntityBase('communications');
export const JobProfile = new EntityBase('job-profiles');
export const Account = new EntityBase('accounts');
export const Contact = new EntityBase('contacts');
export const SystemSetting = new EntityBase('system-settings');
export const Permission = new EntityBase('permissions');
export const Role = new EntityBase('roles');
export const LayoutTemplate = new EntityBase('layout-templates');
export const Job = new EntityBase('jobs');
export const Country = new EntityBase('countries');
export const City = new EntityBase('cities');
export const Territory = new EntityBase('territories');
export const Branch = new EntityBase('branches');
export const Department = new EntityBase('departments');
export const CostComponent = new EntityBase('cost-components');
export const PricingRule = new EntityBase('pricing-rules');
export const Nationality = new EntityBase('nationalities');
export const PriceRequest = new EntityBase('price-requests');
export const SkillLevel = new EntityBase('skill-levels');
export const DiscountApprovalMatrix = new EntityBase('discount-approval-matrix');
export const Notification = new EntityBase('notifications');
export const CustomerInteraction = new EntityBase('customer-interactions');
export const CustomerResponseTemplate = new EntityBase('customer-response-templates');
export const Opportunity = new EntityBase('opportunities');
export const Task = new EntityBase('tasks');
export const Contract = new EntityBase('contracts');
export const SalesMaterial = new EntityBase('sales-materials');
export const AuditLog = new EntityBase('audit-logs');

// User authentication and management with special methods
export const User = {
  // Authentication methods
  async login(credentials) {
    const response = await api.auth.login(credentials);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  async logout() {
    const response = await api.auth.logout();
    localStorage.removeItem('authToken');
    return response.data;
  },

  async register(userData) {
    const response = await api.auth.register(userData);
    return response.data;
  },

  async me() {
    const response = await api.auth.getProfile();
    return response.data;
  },

  async getProfile() {
    const response = await api.auth.getProfile();
    return response.data;
  },

  async updateProfile(data) {
    const response = await api.auth.updateProfile(data);
    return response.data;
  },

  async refreshToken() {
    const response = await api.auth.refreshToken();
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  // User management methods (compatible with old SDK)
  async list(sort = null, limit = null) {
    let endpoint = '/users';
    const params = new URLSearchParams();
    
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('limit', limit);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  },

  async filter(filters = {}, sort = null, limit = null) {
    let endpoint = '/users';
    const params = new URLSearchParams();
    
    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('limit', limit);
    }
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  },

  async get(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async find(filters = {}) {
    const results = await this.filter(filters);
    return results && results.length > 0 ? results[0] : null;
  },

  async create(data) {
    const response = await api.post('/users', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};