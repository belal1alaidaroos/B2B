import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, X, Plus, DollarSign, Percent, Calendar, CheckSquare } from 'lucide-react';

export default function CostComponentMultiSelect({ 
  availableComponents = [], 
  selectedComponentIds = [], 
  onChange,
  systemSettings = { vatRate: 15, currency: 'SAR' }
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Safely filter components based on search term
  const filteredComponents = (availableComponents || []).filter(component =>
    component && (
      (component.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (component.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (component.type || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Get selected components for display
  const selectedComponents = (availableComponents || []).filter(comp => 
    comp && comp.id && (selectedComponentIds || []).includes(comp.id)
  );

  const handleToggleComponent = (componentId) => {
    if (!componentId) return;
    
    const currentIds = selectedComponentIds || [];
    const newSelection = currentIds.includes(componentId)
      ? currentIds.filter(id => id !== componentId)
      : [...currentIds, componentId];
    
    onChange && onChange(newSelection);
  };

  const handleRemoveComponent = (componentId) => {
    if (!componentId) return;
    
    const currentIds = selectedComponentIds || [];
    const newSelection = currentIds.filter(id => id !== componentId);
    onChange && onChange(newSelection);
  };

  const formatComponentValue = (component) => {
    if (!component || !component.value) return '0';
    
    const value = parseFloat(component.value) || 0;
    
    if (component.calculation_method === 'fixed_amount') {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${component.currency || systemSettings.currency}`;
    } else if (component.calculation_method === 'percentage_of_base') {
      return `${value}%`;
    } else {
      return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per unit`;
    }
  };

  const getComponentIcon = (component) => {
    if (!component) return DollarSign;
    
    if (component.calculation_method === 'percentage_of_base') {
      return Percent;
    } else if (component.periodicity === 'monthly') {
      return Calendar;
    } else {
      return DollarSign;
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Components Display */}
      {selectedComponents && selectedComponents.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Selected Components:</Label>
          <div className="flex flex-wrap gap-2">
            {selectedComponents.map(component => {
              if (!component || !component.id) return null;
              
              return (
                <Badge 
                  key={component.id} 
                  variant="secondary" 
                  className="flex items-center gap-1 px-2 py-1"
                >
                  <span className="text-xs">{component.name || 'Unknown'}</span>
                  {component.vat_applicable && (
                    <span className="text-xs text-orange-600 font-semibold">VAT</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-red-100"
                    onClick={() => handleRemoveComponent(component.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Components Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Available Components:</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            {isExpanded ? 'Close' : 'Add Components'}
          </Button>
        </div>

        {isExpanded && (
          <Card className="p-3 border border-gray-200">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>

            {/* Components List */}
            <ScrollArea className="max-h-64">
              {filteredComponents && filteredComponents.length > 0 ? (
                <div className="space-y-2">
                  {filteredComponents.map(component => {
                    if (!component || !component.id) return null;
                    
                    const ComponentIcon = getComponentIcon(component);
                    const isSelected = (selectedComponentIds || []).includes(component.id);
                    
                    return (
                      <div 
                        key={component.id} 
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            id={`component-${component.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleComponent(component.id)}
                          />
                          <div className="flex items-center space-x-2">
                            <ComponentIcon className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="text-sm font-medium">{component.name || 'Unnamed Component'}</div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{formatComponentValue(component)}</span>
                                <span>•</span>
                                <span className="capitalize">{(component.periodicity || 'monthly').replace('_', ' ')}</span>
                                <span>•</span>
                                <span className="capitalize">{(component.type || 'allowance').replace('_', ' ')}</span>
                                {component.vat_applicable && (
                                  <>
                                    <span>•</span>
                                    <span className="text-orange-600 font-semibold">VAT</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No components found</p>
                  {searchTerm && <p className="text-xs">Try adjusting your search</p>}
                </div>
              )}
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}