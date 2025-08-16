import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, MapPin, Calendar, Globe } from "lucide-react";
import { Nationality } from '@/api/entities';
import { City } from '@/api/entities';

const contractDurationOptions = [
  { value: '6', label: '6 Months' },
  { value: '12', label: '1 Year' },
  { value: '24', label: '2 Years' },
  { value: '36', label: '3 Years' },
];

export default function ParametersPanel({ parameters, onParametersChange }) {
  const [nationalities, setNationalities] = useState([]);
  const [isLoadingNationalities, setIsLoadingNationalities] = useState(true);
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);

  useEffect(() => {
    loadNationalities();
    loadCities();
  }, []);

  const loadNationalities = async () => {
    setIsLoadingNationalities(true);
    try {
      const data = await Nationality.filter({ is_active: true });
      setNationalities(data || []);
    } catch (error) {
      console.error("Error loading nationalities:", error);
      setNationalities([]);
    } finally {
      setIsLoadingNationalities(false);
    }
  };

  const loadCities = async () => {
    setIsLoadingCities(true);
    try {
      const data = await City.filter({ is_active: true });
      setCities(data || []);
    } catch (error) {
      console.error("Error loading cities:", error);
      setCities([]);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleChange = (field, value) => {
    onParametersChange(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="clay-card border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          Job Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nationality" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Nationality
            </Label>
            <Select 
              value={parameters.nationality} 
              onValueChange={(value) => handleChange('nationality', value)}
            >
              <SelectTrigger id="nationality" className="clay-element border-none">
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent className="clay-card">
                {isLoadingNationalities ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  nationalities.map(nat => (
                    <SelectItem key={nat.id} value={nat.name.toLowerCase().replace(/ /g, '_')}>
                      {nat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Select 
              value={parameters.location} 
              onValueChange={(value) => handleChange('location', value)}
            >
              <SelectTrigger id="location" className="clay-element border-none">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="clay-card">
                {isLoadingCities ? (
                  <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                ) : (
                  cities.map(city => (
                    <SelectItem key={city.id} value={city.name.toLowerCase().replace(/ /g, '_')}>
                      {city.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contractDuration" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Contract Duration
            </Label>
            <Select 
              value={parameters.contractDuration} 
              onValueChange={(value) => handleChange('contractDuration', value)}
            >
              <SelectTrigger id="contractDuration" className="clay-element border-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="clay-card">
                {contractDurationOptions.map(dur => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={parameters.quantity}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)}
              className="clay-element border-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}