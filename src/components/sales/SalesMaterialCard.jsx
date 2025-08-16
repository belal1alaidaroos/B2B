import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Play,
  Image,
  File,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import { usePermissions } from '@/components/hooks/usePermissions';

const getFileIcon = (fileType) => {
  if (fileType?.includes('video')) return Play;
  if (fileType?.includes('image')) return Image;
  if (fileType?.includes('pdf') || fileType?.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const materialTypeColors = {
  presentation: 'bg-blue-100 text-blue-800',
  brochure: 'bg-green-100 text-green-800',
  case_study: 'bg-purple-100 text-purple-800',
  datasheet: 'bg-orange-100 text-orange-800',
  proposal_template: 'bg-red-100 text-red-800',
  contract_template: 'bg-gray-100 text-gray-800',
  demo_video: 'bg-pink-100 text-pink-800',
  training_material: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800'
};

export default function SalesMaterialCard({ material, onDownload, onDelete }) {
  const { canUpdate, canDelete } = usePermissions();
  const FileIcon = getFileIcon(material.file_type);

  return (
    <Card className="clay-card border-none hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 clay-button flex items-center justify-center flex-shrink-0">
              <FileIcon className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold text-gray-800 truncate mb-1">
                {material.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={`${materialTypeColors[material.material_type] || 'bg-gray-100 text-gray-800'} border-none text-xs rounded-xl`}>
                  {material.material_type.replace('_', ' ')}
                </Badge>
                {material.language === 'ar' && (
                  <Badge variant="outline" className="text-xs">عربي</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {material.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {material.description}
          </p>
        )}
        
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {material.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs py-0 px-1">
                {tag}
              </Badge>
            ))}
            {material.tags.length > 3 && (
              <Badge variant="outline" className="text-xs py-0 px-1">
                +{material.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(material.created_date), 'MMM d, yyyy')}</span>
          </div>
          {material.download_count > 0 && (
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              <span>{material.download_count} downloads</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
          <div className="text-xs text-gray-500">
            {formatFileSize(material.file_size)}
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDownload(material)}
              className="h-7 w-7 hover:bg-emerald-100"
              title="Download"
            >
              <Download className="w-4 h-4 text-emerald-600" />
            </Button>
            
            {canUpdate('sales_enablement') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-blue-100"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-blue-600" />
              </Button>
            )}
            
            {canDelete('sales_enablement') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(material.id)}
                className="h-7 w-7 hover:bg-red-100"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}