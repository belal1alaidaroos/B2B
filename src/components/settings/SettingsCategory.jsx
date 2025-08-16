
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, DollarSign, MessageSquare, Palette, Layout, Shield } from 'lucide-react';
import SettingField from './SettingField';

const categoryIcons = {
  general: Settings,
  localization: Globe,
  financial: DollarSign,
  communication: MessageSquare,
  appearance: Palette,
  security: Shield
};

const categoryColors = {
  general: 'bg-blue-100 text-blue-800',
  localization: 'bg-green-100 text-green-800',
  financial: 'bg-yellow-100 text-yellow-800',
  communication: 'bg-purple-100 text-purple-800',
  appearance: 'bg-pink-100 text-pink-800',
  security: 'bg-red-100 text-red-800'
};

// **AGGRESSIVE FINAL FILTER**
// This list contains all setting keys that have been requested for removal.
const DEFINITIVELY_BLOCKED_KEYS = [
    'available_cities',
    'available_territories',
    'available_countries',
    'supported_languages',
    'user_roles',
    'company_departments',
    'company_branches'
];

export default function SettingsCategory({ category, settings, values, onChange, errors = {} }) {
  // **EMERGENCY FIX**: Filter the settings prop directly and immediately.
  // This will prevent the deprecated settings from being rendered under any circumstances.
  const filteredSettings = settings.filter(s => {
      const isBlocked = DEFINITIVELY_BLOCKED_KEYS.includes(s.key);
      if (isBlocked) {
          console.error(`CRITICAL: Blocked setting '${s.key}' was about to be rendered in category '${category}'. Forcibly removing.`);
      }
      return !isBlocked;
  });

  const subcategories = [...new Set(filteredSettings.map(s => s.subcategory).filter(Boolean))];
  const settingsWithoutSubcategory = filteredSettings.filter(s => !s.subcategory);
  const IconComponent = categoryIcons[category] || Settings;

  // Default values for reset functionality, centralized here
  const defaultValues = {
    primary_color: '#059669',
    secondary_color: '#6366f1',
    primary_font: { family: 'Cairo', size: 14 },
    secondary_font: { family: 'Inter', size: 12 },
    button_size: 'medium',
    input_size: 'medium'
  };

  const handleReset = (key) => {
    if (defaultValues[key] !== undefined) {
      onChange(key, defaultValues[key]);
    }
  };

  return (
    <Card className="clay-card border-none overflow-hidden">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <IconComponent className="w-6 h-6 text-emerald-600" />
            {category.charAt(0).toUpperCase() + category.slice(1)} Settings
          </CardTitle>
          {/* The badge will now correctly count ONLY the visible settings */}
          <Badge className={`${categoryColors[category]} border-none rounded-xl`}>
            {filteredSettings.length} settings
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {settingsWithoutSubcategory.length > 0 && (
          <div className="flex flex-col">
            {settingsWithoutSubcategory
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .map((setting) => (
                <SettingField 
                  key={setting.key} 
                  setting={setting} 
                  value={values[setting.key]} 
                  onChange={onChange} 
                  error={errors[setting.key]}
                  onReset={category === 'appearance' ? handleReset : null}
                />
              ))}
          </div>
        )}

        {subcategories.map((subcategory) => {
          // Use the filtered list to get subcategory settings
          const subcategorySettings = filteredSettings.filter(s => s.subcategory === subcategory).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

          return (
            <div key={subcategory} className="space-y-2 pt-4">
              <div className="px-6 pb-2">
                <h4 className="text-base font-semibold text-gray-700">{subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}</h4>
                <div className="w-16 h-0.5 bg-emerald-500 mt-1"></div>
              </div>
              <div className="flex flex-col">
                {subcategorySettings.map((setting) => (
                  <SettingField 
                    key={setting.key} 
                    setting={setting} 
                    value={values[setting.key]} 
                    onChange={onChange} 
                    error={errors[setting.key]}
                    onReset={category === 'appearance' ? handleReset : null}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
