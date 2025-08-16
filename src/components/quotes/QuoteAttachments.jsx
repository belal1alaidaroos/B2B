import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadFile } from '@/api/integrations';
import { Paperclip, Upload, X, FileText, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function QuoteAttachments({ attachments = [], onAttachmentsChange }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadPromises = files.map(file => UploadFile({ file }));
      const uploadResults = await Promise.all(uploadPromises);
      
      const newAttachments = uploadResults.map((result, index) => ({
        url: result.file_url,
        name: files[index].name,
        size: files[index].size,
        type: files[index].type,
        uploaded_at: new Date().toISOString()
      }));

      onAttachmentsChange([...attachments, ...newAttachments]);
      
      // Reset file input
      event.target.value = '';
      
    } catch (error) {
      console.error("Error uploading files:", error);
      setUploadError("Failed to upload files. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (index) => {
    const updatedAttachments = attachments.filter((_, i) => i !== index);
    onAttachmentsChange(updatedAttachments);
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word')) return '📝';
    if (type?.includes('excel') || type?.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="clay-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-emerald-600" />
          Attachments
          {attachments.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {attachments.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-500 transition-colors">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isUploading ? 'Uploading...' : 'Click to upload files'}
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, XLS, Images up to 10MB each
                </p>
              </div>
            </div>
          </label>
        </div>

        {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {uploadError}
          </div>
        )}

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Files</h4>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-lg">{getFileIcon(attachment.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(attachment.size)}</span>
                        {attachment.uploaded_at && (
                          <span>• {new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(attachment.url, '_blank')}
                      className="h-8 w-8 hover:bg-blue-100"
                      title="View/Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveAttachment(index)}
                      className="h-8 w-8 text-red-500 hover:bg-red-100"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {attachments.length === 0 && !isUploading && (
          <div className="text-center py-4 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No attachments yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}