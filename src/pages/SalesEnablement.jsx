import React, { useState, useEffect } from 'react';
import { SalesMaterial } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Filter,
  FolderOpen,
  BarChart3,
  Clock,
  Users
} from 'lucide-react';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent, { ProtectedButton } from '@/components/common/ProtectedComponent';

import SalesMaterialUploadForm from '../components/sales/SalesMaterialUploadForm';
import SalesMaterialCard from '../components/sales/SalesMaterialCard';
import SalesMaterialStats from '../components/sales/SalesMaterialStats';

export default function SalesEnablementPage() {
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { canRead, canCreate } = usePermissions();

  useEffect(() => {
    if (canRead('sales_enablement')) {
      loadMaterials();
    } else {
      setIsLoading(false);
    }
  }, [canRead]);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
      const materialsData = await SalesMaterial.list('-created_date');
      setMaterials(materialsData || []);
    } catch (error) {
      console.error("Error loading sales materials:", error);
      setMaterials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadMaterials();
    setIsUploadDialogOpen(false);
  };

  const handleDelete = async (materialId) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await SalesMaterial.delete(materialId);
        loadMaterials();
      } catch (error) {
        console.error("Failed to delete material:", error);
        alert("Failed to delete material.");
      }
    }
  };

  const handleDownload = async (material) => {
    try {
      // Increment download count
      await SalesMaterial.update(material.id, {
        download_count: (material.download_count || 0) + 1,
        last_downloaded: new Date().toISOString()
      });
      
      // Open file in new tab
      window.open(material.file_url, '_blank');
      
      // Reload to update download count
      loadMaterials();
    } catch (error) {
      console.error("Error tracking download:", error);
      // Still open the file even if tracking fails
      window.open(material.file_url, '_blank');
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || material.material_type === selectedType;
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  if (!canRead('sales_enablement')) {
    return <ProtectedComponent module="sales_enablement" />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Enablement Library</h1>
          <p className="text-sm text-gray-600">Access all your sales materials, presentations, and resources in one place.</p>
        </div>
        <ProtectedButton module="sales_enablement" action="create">
          <Button onClick={() => setIsUploadDialogOpen(true)} className="clay-button bg-emerald-600 text-white">
            <Upload className="w-4 h-4 mr-2" />
            Upload Material
          </Button>
        </ProtectedButton>
      </div>

      {/* Stats */}
      <SalesMaterialStats materials={materials} isLoading={isLoading} />

      {/* Search and Filters */}
      <Card className="clay-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 clay-element border-none"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40 clay-element border-none">
                  <SelectValue placeholder="Material Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="presentation">Presentations</SelectItem>
                  <SelectItem value="brochure">Brochures</SelectItem>
                  <SelectItem value="case_study">Case Studies</SelectItem>
                  <SelectItem value="datasheet">Datasheets</SelectItem>
                  <SelectItem value="proposal_template">Proposal Templates</SelectItem>
                  <SelectItem value="contract_template">Contract Templates</SelectItem>
                  <SelectItem value="demo_video">Demo Videos</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 clay-element border-none">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="product_overview">Product Overview</SelectItem>
                  <SelectItem value="industry_specific">Industry Specific</SelectItem>
                  <SelectItem value="competitor_comparison">Competitor Analysis</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="technical_specs">Technical Specs</SelectItem>
                  <SelectItem value="customer_testimonials">Testimonials</SelectItem>
                  <SelectItem value="templates">Templates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredMaterials.length === 0 ? (
          <Card className="clay-card">
            <CardContent className="text-center py-12">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {searchTerm || selectedType !== 'all' || selectedCategory !== 'all' 
                  ? 'No materials match your search'
                  : 'No materials uploaded yet'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedType !== 'all' || selectedCategory !== 'all'
                  ? 'Try adjusting your search criteria or filters'
                  : 'Upload your first sales material to get started'
                }
              </p>
              {canCreate('sales_enablement') && (
                <Button onClick={() => setIsUploadDialogOpen(true)} className="clay-button bg-emerald-600 text-white">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Material
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMaterials.map(material => (
              <SalesMaterialCard
                key={material.id}
                material={material}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[600px] clay-card">
          <DialogHeader>
            <DialogTitle>Upload Sales Material</DialogTitle>
          </DialogHeader>
          <SalesMaterialUploadForm
            onSuccess={handleUploadSuccess}
            onCancel={() => setIsUploadDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}