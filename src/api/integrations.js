import { api } from './apiClient';

// Core integration services
export const Core = {
  // AI/LLM Integration
  async InvokeLLM(data) {
    const response = await api.post('/integrations/core/invoke-llm', data);
    return response.data;
  },

  // Email Integration
  async SendEmail(emailData) {
    const response = await api.post('/integrations/core/send-email', emailData);
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
    
    const response = await api.post('/integrations/core/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Image Generation Integration
  async GenerateImage(imageData) {
    const response = await api.post('/integrations/core/generate-image', imageData);
    return response.data;
  },

  // Data Extraction Integration
  async ExtractDataFromUploadedFile(extractionData) {
    const response = await api.post('/integrations/core/extract-data', extractionData);
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
  
  // Utility functions
  async getIntegrationStatus() {
    const response = await api.get('/integrations/status');
    return response.data;
  },

  async getIntegrationConfig(integrationName) {
    const response = await api.get(`/integrations/config/${integrationName}`);
    return response.data;
  },

  async updateIntegrationConfig(integrationName, config) {
    const response = await api.put(`/integrations/config/${integrationName}`, config);
    return response.data;
  }
};






