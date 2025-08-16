
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function SettingField({ setting, value, onChange, error, onReset }) {
  const [localValue, setLocalValue] = useState(value ?? setting.default_value ?? '');

  useEffect(() => {
    // Sync localValue with external 'value' prop or 'default_value' when they change.
    // Using nullish coalescing (??) to correctly handle `0` or `false` as valid values.
    setLocalValue(value ?? setting.default_value ?? '');
  }, [value, setting.default_value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    onChange(setting.key, newValue);
  };

  const handleReset = () => {
    if (onReset) {
      onReset(setting.key);
    }
  };

  const renderInput = () => {
    switch (setting.data_type) {
      case 'string':
        return (
          <Input
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={setting.placeholder}
            className="clay-element border-none"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={localValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            placeholder={setting.placeholder}
            className="clay-element border-none"
          />
        );
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(localValue)}
              onCheckedChange={handleChange}
              className="data-[state=checked]:bg-emerald-600"
            />
            <Label className="text-sm text-gray-600">
              {Boolean(localValue) ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        );
      
      case 'select':
        return (
          <Select value={String(localValue)} onValueChange={handleChange}>
            <SelectTrigger className="clay-element border-none">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="clay-card">
              {(setting.options || []).map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    {option.icon && <span>{option.icon}</span>}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'color':
        return (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={localValue || '#000000'}
              onChange={(e) => handleChange(e.target.value)}
              className="w-12 h-10 rounded-lg border clay-element cursor-pointer"
            />
            <Input
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="#000000"
              className="clay-element border-none font-mono"
            />
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="px-2 py-1 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        );

      case 'font':
        return (
          <div className="space-y-2">
            <Textarea
              value={typeof localValue === 'object' ? JSON.stringify(localValue, null, 2) : localValue}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange(parsed);
                } catch {
                  // If parsing fails, treat it as a string input for now.
                  // Real-world validation might be more strict.
                  handleChange(e.target.value);
                }
              }}
              placeholder='{"family": "Inter", "size": 14}'
              className="clay-element border-none h-20 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              Enter font configuration as JSON, e.g., {'{"family": "Arial", "size": 16}'}
            </p>
            {onReset && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="px-2 py-1 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        );
      
      case 'json':
        return (
          <Textarea
            value={typeof localValue === 'object' ? JSON.stringify(localValue, null, 2) : localValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch {
                // If parsing fails, treat it as a string input for now.
                handleChange(e.target.value);
              }
            }}
            placeholder="Enter valid JSON"
            className="clay-element border-none h-32 font-mono text-sm"
          />
        );
      
      default:
        return (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">Unsupported field type: {setting.data_type}</p>
          </div>
        );
    }
  };

  return (
    <div className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between border-t border-gray-200/50 hover:bg-gray-50/30 transition-colors duration-200">
      <div className="md:w-1/3">
        <Label htmlFor={setting.key} className="font-semibold text-gray-800">{setting.display_name}</Label>
        <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
      <div className="flex-1 max-w-lg flex items-center gap-2">
        <div className="flex-1">
            {renderInput()}
        </div>
        {/* The general reset button, if present, should also use handleReset */}
        {onReset && (
          <Button variant="ghost" size="icon" onClick={handleReset} title="Reset to default">
            <RotateCcw className="w-4 h-4 text-gray-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
