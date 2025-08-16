import React, { useState } from 'react';
import { SalesMaterial } from '@/api/entities';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, X, File, Loader2 } from 'lucide-react';

export default function SalesMaterialUploadForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'presentation',
    category: 'product_overview',
    target_audience: 'all',
    industry_focus: [],
    language: 'en',
    version: '1.0',
    status: 'active',
    access_level: 'internal_only',
    tags: [],
    notes: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    
    // Auto-fill title if empty
    if (!formData.title && file) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setFormData(prev => ({ ...prev, title: nameWithoutExt }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('Please provide a title for the material');
      return;
    }

    setIsUploading(true);
    try {
      // Get current user
      const currentUser = await User.me();
      
      // Upload file
      const uploadResult = await UploadFile({ file: selectedFile });
      
      // Create sales material record
      const materialData = {
        ...formData,
        file_url: uploadResult.file_url,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        created_by: currentUser.id,
        last_updated_by: currentUser.id
      };
      
      await SalesMaterial.create(materialData);
      onSuccess();
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Failed to upload material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="file-upload">File *</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
          <input
            type="file"
            id="file-upload"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
            required
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600">
                <File className="w-8 h-8" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p>Click to upload or drag and drop</p>
                <p className="text-sm">PDF, DOC, PPT, Images, Videos up to 50MB</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter material title"
            required
          />
        </div>
        <div>
          <Label htmlFor="version">Version</Label>
          <Input
            id="version"
            value={formData.version}
            onChange={(e) => handleInputChange('version', e.target.value)}
            placeholder="1.0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe this material and when to use it..."
          rows={3}
        />
      </div>

      {/* Classification */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Material Type</Label>
          <Select value={formData.material_type} onValueChange={(value) => handleInputChange('material_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presentation">Presentation</SelectItem>
              <SelectItem value="brochure">Brochure</SelectItem>
              <SelectItem value="case_study">Case Study</SelectItem>
              <SelectItem value="datasheet">Datasheet</SelectItem>
              <SelectItem value="proposal_template">Proposal Template</SelectItem>
              <SelectItem value="contract_template">Contract Template</SelectItem>
              <SelectItem value="pricing_sheet">Pricing Sheet</SelectItem>
              <SelectItem value="demo_video">Demo Video</SelectItem>
              <SelectItem value="training_material">Training Material</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product_overview">Product Overview</SelectItem>
              <SelectItem value="industry_specific">Industry Specific</SelectItem>
              <SelectItem value="competitor_comparison">Competitor Comparison</SelectItem>
              <SelectItem value="pricing">Pricing</SelectItem>
              <SelectItem value="legal_compliance">Legal Compliance</SelectItem>
              <SelectItem value="technical_specs">Technical Specs</SelectItem>
              <SelectItem value="customer_testimonials">Customer Testimonials</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="templates">Templates</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Target Audience</Label>
          <Select value={formData.target_audience} onValueChange={(value) => handleInputChange('target_audience', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="prospects">Prospects</SelectItem>
              <SelectItem value="existing_clients">Existing Clients</SelectItem>
              <SelectItem value="internal_team">Internal Team</SelectItem>
              <SelectItem value="partners">Partners</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Language</Label>
          <Select value={formData.language} onValueChange={(value) => handleInputChange('language', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Access Level</Label>
          <Select value={formData.access_level} onValueChange={(value) => handleInputChange('access_level', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="internal_only">Internal Only</SelectItem>
              <SelectItem value="management_only">Management Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <Button type="button" onClick={addTag} variant="outline">Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
            </Badge>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Internal Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Internal notes about this material..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isUploading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isUploading} className="bg-emerald-600 text-white">
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Material'
          )}
        </Button>
      </div>
    </form>
  );
}