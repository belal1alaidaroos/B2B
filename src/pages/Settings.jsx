
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { Settings as SettingsIcon, Save, Shield, RefreshCw, Globe, DollarSign, MessageSquare, Palette, Layout, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { uniqBy } from 'lodash';

import SettingsCategory from '../components/settings/SettingsCategory';

const tabIcons = {
  general: SettingsIcon,
  localization: Globe,
  financial: DollarSign,
  communication: MessageSquare,
  appearance: Palette,
  security: Shield
};

// HARDCODE THE EXACT SETTINGS WE WANT TO SHOW
const ALLOWED_SETTINGS_KEYS = [
  // General settings (excluding user_roles, company_departments, company_branches)
  'app_name',
  'app_description',
  'company_name',
  'company_logo',
  'company_address',
  'company_phone',
  'company_email',
  'default_timezone',
  'date_format',
  'time_format',
  
  // Localization (excluding available_cities, available_territories, available_countries, supported_languages)
  'default_language',
  'currency',
  'number_format',
  
  // Financial
  'default_currency',
  'tax_rate',
  'vat_rate', // Added VAT Rate
  'payment_terms',
  
  // Communication
  'email_server',
  'smtp_settings',
  'notification_settings',
  
  // Appearance
  'primary_color',
  'secondary_color',
  'theme',
  'layout_style',
  'primary_font', // Added primary_font
  'secondary_font', // Added secondary_font
  
  // Security
  'password_policy',
  'session_timeout',
  'two_factor_auth'
];

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState([]);
  const [settingsValues, setSettingsValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    loadUserAndSettings();
  }, []);

  const loadUserAndSettings = async () => {
    setIsLoading(true);
    try {
      const [userData, allSettingsData] = await Promise.all([
        User.me(),
        SystemSetting.list()
      ]);
      
      setCurrentUser(userData);

      console.log("=== USING WHITELIST APPROACH ===");
      console.log("Allowed keys:", ALLOWED_SETTINGS_KEYS);

      // ONLY SHOW SETTINGS THAT ARE IN THE ALLOWED LIST
      const whitelistedSettings = allSettingsData.filter(setting => {
        const isAllowed = ALLOWED_SETTINGS_KEYS.includes(setting.key);
        if (!isAllowed) {
          console.log(`BLOCKING: ${setting.key} - ${setting.display_name} (not in whitelist)`);
        }
        return isAllowed;
      });

      console.log(`=== WHITELIST RESULT: ${whitelistedSettings.length} settings shown (blocked ${allSettingsData.length - whitelistedSettings.length}) ===`);
      
      const uniqueSettings = uniqBy(whitelistedSettings, 'key');
      const sortedSettings = uniqueSettings.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
      setSettings(sortedSettings);
      
      const values = {};
      sortedSettings.forEach(setting => {
        // The value from DB is always a string, parse it for the UI state.
        let parsedValue = setting.value;
        if (setting.data_type === 'json' || setting.data_type === 'font') {
          try {
            parsedValue = JSON.parse(setting.value);
          } catch (e) {
            console.warn(`Failed to parse JSON for setting ${setting.key}: ${setting.value}`, e);
            parsedValue = setting.value; // Keep as string if JSON is invalid
          }
        } else if (setting.data_type === 'boolean') {
            parsedValue = setting.value === 'true'; // Convert "true"/"false" strings to boolean
        } else if (setting.data_type === 'number') {
          parsedValue = Number(setting.value); // Convert number strings to actual numbers
        }
        values[setting.key] = parsedValue;
      });
      setSettingsValues(values);

      const initialGroupedSettings = sortedSettings.reduce((acc, setting) => {
        const category = (setting.category || 'general').toLowerCase();
        // Normalize 'finance' to 'financial' to merge tabs
        const normalizedCategory = category === 'finance' ? 'financial' : category;
        if (!acc[normalizedCategory]) acc[normalizedCategory] = [];
        acc[normalizedCategory].push(setting);
        return acc;
      }, {});
      
      const initialCategories = Object.keys(initialGroupedSettings).sort((a,b) => {
        const order = ['general', 'localization', 'financial', 'communication', 'appearance', 'security'];
        return order.indexOf(a) - order.indexOf(b);
      });
      
      if (initialCategories.length > 0) {
        setActiveCategory(activeCategory || initialCategories[0]);
      }
      
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: 'error', text: 'Failed to load settings. Please refresh the page.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = currentUser?.email;

  const handleSettingChange = (key, value) => {
    setSettingsValues(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateSettings = () => {
    const newErrors = {};
    settings.forEach(setting => {
      if (setting.validation) {
        const value = settingsValues[setting.key];
        const validation = setting.validation;
        
        if (validation.required && (value === undefined || value === null || (typeof value === 'string' && value.trim() === ''))) {
          newErrors[setting.key] = `${setting.display_name} is required`;
        }
        
        if (setting.data_type === 'number' && value !== undefined && value !== null && !isNaN(Number(value))) {
          const numValue = Number(value);
          if (validation.min !== undefined && numValue < validation.min) newErrors[setting.key] = `Minimum value is ${validation.min}`;
          if (validation.max !== undefined && numValue > validation.max) newErrors[setting.key] = `Maximum value is ${validation.max}`;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAll = async () => {
    if (!validateSettings()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updatePromises = settings
        .filter(setting => {
          const originalValueStr = setting.value; // Value from DB, always a string
          const currentValue = settingsValues[setting.key]; // Current value in state, can be object, boolean, number, string
          
          let currentValueStr;
          if (typeof currentValue === 'object' && currentValue !== null) {
            currentValueStr = JSON.stringify(currentValue);
          } else if (setting.data_type === 'boolean') {
            currentValueStr = currentValue ? 'true' : 'false';
          } else {
            currentValueStr = String(currentValue);
          }
          
          return currentValueStr !== originalValueStr; // Compare string representations
        })
        .map(setting => {
          const currentValue = settingsValues[setting.key];
          
          let valueToSaveStr;
          if (typeof currentValue === 'object' && currentValue !== null) {
            valueToSaveStr = JSON.stringify(currentValue);
          } else if (setting.data_type === 'boolean') {
            valueToSaveStr = currentValue ? 'true' : 'false';
          } else {
            valueToSaveStr = String(currentValue);
          }

          // Create the full payload with all required fields
          // This ensures that all necessary properties are explicitly sent,
          // providing defaults if they were missing from the initial fetch.
          const payload = {
            key: setting.key,
            value: valueToSaveStr,
            data_type: setting.data_type || 'string',
            category: setting.category || 'general',
            display_name: setting.display_name || setting.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            description: setting.description || `Setting for ${setting.key}`,
            options: setting.options || [],
            requires_restart: setting.requires_restart || false,
            display_order: setting.display_order || 0,
            is_sensitive: setting.is_sensitive || false,
            subcategory: setting.subcategory || ''
          };
          
          return SystemSetting.update(setting.id, payload);
        });
        
      await Promise.all(updatePromises);
      
      const restartRequiredSettings = settings.filter(setting => {
        const originalValueStr = setting.value;
        const currentValue = settingsValues[setting.key];
        let currentValueStr;

        if (typeof currentValue === 'object' && currentValue !== null) {
          currentValueStr = JSON.stringify(currentValue);
        } else if (setting.data_type === 'boolean') {
          currentValueStr = currentValue ? 'true' : 'false';
        } else {
          currentValueStr = String(currentValue);
        }
        
        return setting.requires_restart && currentValueStr !== originalValueStr;
      });

      if (restartRequiredSettings.length > 0) {
        setMessage({ type: 'warning', text: 'Settings saved! Some changes require an application restart to take effect.' });
      } else {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      }
      
      // Reload settings to get updated original values and ensure consistency
      await loadUserAndSettings(); 
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    const category = (setting.category || 'general').toLowerCase();
    // Normalize 'finance' to 'financial' to merge tabs
    const normalizedCategory = category === 'finance' ? 'financial' : category;
    if (!acc[normalizedCategory]) acc[normalizedCategory] = [];
    acc[normalizedCategory].push(setting);
    return acc;
  }, {});

  const categories = Object.keys(groupedSettings).sort((a,b) => {
    const order = ['general', 'localization', 'financial', 'communication', 'appearance', 'security'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="p-4 space-y-4 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">System Settings</h1>
            <p className="text-sm text-gray-600">Configure and customize system-wide application settings.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={loadUserAndSettings} 
              disabled={isLoading || isSaving}
              className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleSaveAll}
              disabled={isLoading || isSaving}
              className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-4 py-2"
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
          </div>
        </header>

        {message && (
          <Alert className={`mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : message.type === 'warning' 
              ? 'bg-amber-50 border-amber-200 text-amber-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <SettingsIcon className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <aside className="md:col-span-1">
            <Card className="clay-card p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Categories</h2>
              <nav className="space-y-2">
                {categories.map(category => {
                  const IconComponent = tabIcons[category] || SettingsIcon;
                  return (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`w-full text-left flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm font-medium ${
                        activeCategory === category 
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </aside>

          <main className="md:col-span-3">
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-4">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-3 w-96" />
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="clay-card p-4">
                {activeCategory && groupedSettings[activeCategory] ? (
                  <SettingsCategory
                    category={activeCategory}
                    settings={groupedSettings[activeCategory]}
                    values={settingsValues}
                    onChange={handleSettingChange}
                    errors={errors}
                  />
                ) : (
                  <p className="text-gray-600 text-center py-8">Select a category to view settings, or no settings available for this category.</p>
                )}
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
