import { api } from './apiClient';

// Entity classes that provide CRUD operations for each entity type
class EntityBase {
  constructor(entityType) {
    this.entityType = entityType;
  }

  async getAll(params = {}) {
    const response = await api.getAll(this.entityType);
    return response.data;
  }

  async getById(id) {
    const response = await api.getById(this.entityType, id);
    return response.data;
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

// User authentication and management
export const User = {
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
  }
};