import { api } from './apiClient';

// Core integration services - mapped to backend's IntegrationsController
export const Core = {
  // AI/LLM Integration
  async InvokeLLM(data) {
    const response = await api.integrations.core.invokeLLM(data);
    return response.data;
  },

  // Email Integration
  async SendEmail(emailData) {
    const response = await api.integrations.core.sendEmail(emailData);
    return response.data;
  },

  // File Upload Integration
  async UploadFile(fileData) {
    const formData = new FormData();
    if (fileData.file instanceof File) {
      formData.append('file', fileData.file);
    }
    if (fileData.metadata) {
      formData.append('metadata', JSON.stringify(fileData.metadata));
    }
    
    const response = await api.integrations.core.uploadFile(formData);
    return response.data;
  },

  // Image Generation Integration
  async GenerateImage(imageData) {
    const response = await api.integrations.core.generateImage(imageData);
    return response.data;
  },

  // Data Extraction Integration
  async ExtractDataFromUploadedFile(extractionData) {
    const response = await api.integrations.core.extractData(extractionData);
    return response.data;
  },

  // Template Email Integration
  async SendTemplateEmail(templateData) {
    const response = await api.integrations.core.sendTemplateEmail(templateData);
    return response.data;
  }
};

// Export individual functions for backward compatibility
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;

// Additional integration helpers
export const Integrations = {
  Core,
  
  // File Management
  async downloadFile(fileUrl) {
    const response = await api.integrations.downloadFile(fileUrl);
    return response.data;
  },

  // Notification Management
  async createNotification(notificationData) {
    const response = await api.integrations.createNotification(notificationData);
    return response.data;
  },

  // Utility functions for integration status
  async getIntegrationStatus() {
    const response = await api.get('/api/integrations/status');
    return response.data;
  },

  async getIntegrationConfig(integrationName) {
    const response = await api.get(`/api/integrations/config/${integrationName}`);
    return response.data;
  },

  async updateIntegrationConfig(integrationName, config) {
    const response = await api.put(`/api/integrations/config/${integrationName}`, config);
    return response.data;
  }
};






