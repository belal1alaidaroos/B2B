
import React, { useState, useEffect, useMemo } from 'react';

// Components
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Briefcase, Globe, Hash, Calendar, MapPin, Loader2, BarChart2 } from 'lucide-react';

const contractDurationOptions = [
  { value: '6', label: '6 Months' },
  { value: '12', label: '1 Year' },
  { value: '24', label: '2 Years' },
  { value: '36', label: '3 Years' },
];

const categoryColors = {
  construction: 'bg-orange-100 text-orange-800',
  hospitality: 'bg-pink-100 text-pink-800',
  healthcare: 'bg-green-100 text-green-800',
  manufacturing: 'bg-blue-100 text-blue-800',
  logistics: 'bg-purple-100 text-purple-800',
  technical: 'bg-indigo-100 text-indigo-800',
  administrative: 'bg-gray-100 text-gray-800',
  other: 'bg-yellow-100 text-yellow-800'
};

const formatCurrency = (value, currency = 'AED') => {
    const currencySymbols = {
        'AED': 'د.إ', 'SAR': 'ر.س', 'USD': '$', 'EUR': '€', 'GBP': '£'
    };
    const symbol = currencySymbols[currency] || currency;
    return `${new Intl.NumberFormat('en-US').format(value || 0)} ${symbol}`;
};

// Rule Evaluation Engine (copied from PricingEngine)
const evaluateConditions = (conditions, facts, rule) => {
  // 1. Date check
  const now = new Date();
  if (rule.from_date && new Date(rule.from_date) > now) return false;
  if (rule.to_date && new Date(rule.to_date) < now) return false;

  if (!conditions || !conditions.all || conditions.all.length === 0) return true;
  
  const getFactValue = (factPath) => {
    const path = factPath.split('.');
    let value = facts;
    for (const key of path) {
      if (value === undefined || value === null) return undefined;
      value = value[key];
    }
    return value;
  };

  for (const condition of conditions.all) {
    const factValue = getFactValue(condition.fact);
    const conditionValue = condition.value;
    if (factValue === undefined) return false;
    switch (condition.operator) {
      case 'equal': if (factValue != conditionValue) return false; break;
      case 'not_equal': if (factValue == conditionValue) return false; break;
      case 'greater_than': if (parseFloat(factValue) <= parseFloat(conditionValue)) return false; break;
      case 'less_than': if (parseFloat(factValue) >= parseFloat(conditionValue)) return false; break;
      case 'greater_than_or_equal': if (parseFloat(factValue) < parseFloat(conditionValue)) return false; break;
      case 'less_than_or_equal': if (parseFloat(factValue) > parseFloat(conditionValue)) return false; break;
      case 'in': const list = Array.isArray(conditionValue) ? conditionValue : String(conditionValue).split(',').map(s => s.trim()); if (!list.includes(String(factValue))) return false; break;
      case 'contains': if (!String(factValue).includes(String(conditionValue))) return false; break;
      case 'starts_with': if (!String(factValue).startsWith(String(conditionValue))) return false; break;
      case 'between':
        const from = parseFloat(conditionValue?.[0]);
        const to = parseFloat(conditionValue?.[1]);
        const value = parseFloat(factValue);
        if (isNaN(from) || isNaN(to) || isNaN(value)) return false;
        if (value < from || value > to) return false;
        break;
      default: return false;
    }
  }
  return true;
};

export default function QuoteLineItem({ index, data, onUpdate, onRemove, setupData }) {
  const [lineData, setLineData] = useState(data);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { jobProfiles, nationalities, cities, costComponents, pricingRules } = setupData;

  useEffect(() => {
    // When the component initializes, find the corresponding job profile
    if (lineData.job_title && jobProfiles.length > 0) {
      const job = jobProfiles.find(j => j.job_title === lineData.job_title);
      setSelectedJob(job);
    }
  }, [lineData.job_title, jobProfiles]);

  const handleChange = (field, value) => {
    const updatedLineData = { ...lineData, [field]: value };
    
    if (field === 'job_title') {
      const job = jobProfiles.find(j => j.job_title === value);
      setSelectedJob(job);
    }
    
    setLineData(updatedLineData);
  };
  
  // Debounced update to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      onUpdate(index, lineData);
    }, 500); // 500ms debounce
    return () => clearTimeout(handler);
  }, [lineData]);

  // Calculation Logic
  useEffect(() => {
    const calculate = () => {
      if (!selectedJob) return;
      setIsCalculating(true);
      
      const facts = {
        line_item: {
          job_profile_id: selectedJob.id,
          job_id: selectedJob.job_id,
          skill_level_id: selectedJob.skill_level_id,
          job_category: selectedJob.category,
          quantity: lineData.quantity,
          nationality: lineData.nationality,
          contract_duration: parseInt(lineData.contract_duration, 10),
          location: lineData.location,
          job_title: selectedJob.job_title,
        },
        base_cost: selectedJob.base_cost
      };

      const appliedComponentsMap = new Map(); // Use a Map to handle unique components, potentially overridden by later rules
      let markupPercentage = 0;
      let discountPercentage = 0;
      const appliedRulesExplanation = []; // To store details of applied rules

      for (const rule of pricingRules) {
        if (evaluateConditions(rule.conditions, facts, rule)) {
          appliedRulesExplanation.push({ name: `Rule: ${rule.name}`, details: `Priority ${rule.priority}. Conditions met.` });
          for (const action of rule.actions) {
            switch (action.type) {
              case 'add_cost_component':
                const component = costComponents.find(c => c.id === action.params.component_id);
                if (component) appliedComponentsMap.set(component.id, { ...component, applied_value: action.params.value !== undefined ? action.params.value : component.value });
                break;
              case 'apply_markup_percentage': markupPercentage += parseFloat(action.params.value || 0); break;
              case 'apply_discount_percentage': discountPercentage += parseFloat(action.params.value || 0); break;
              default: console.warn(`Unknown action type: ${action.type}`);
            }
          }
          if (rule.stop_if_matched) {
            appliedRulesExplanation.push({ name: `Halt`, details: `Stopped further rule evaluation.` });
            break;
          }
        }
      }
      
      const uniqueAppliedComponents = Array.from(appliedComponentsMap.values());
      
      let monthlyCostPerUnit = selectedJob.base_cost || 0;
      let oneTimeCostPerUnit = 0;
      
      uniqueAppliedComponents.forEach(comp => {
        let value = comp.applied_value;
        if (comp.calculation_method === 'percentage_of_base') {
          value = (selectedJob.base_cost * (value / 100));
        }
        if (comp.periodicity === 'monthly') monthlyCostPerUnit += value;
        else if (comp.periodicity === 'one_time') oneTimeCostPerUnit += value;
      });
      
      monthlyCostPerUnit = monthlyCostPerUnit * (1 + markupPercentage / 100) * (1 - discountPercentage / 100);

      const durationMonths = parseInt(lineData.contract_duration, 10);
      const subtotal = (monthlyCostPerUnit * durationMonths + oneTimeCostPerUnit) * lineData.quantity;

      setLineData(prev => ({
        ...prev,
        cost_breakdown: uniqueAppliedComponents.map(c => ({ component_name: c.name, value: c.value, periodicity: c.periodicity, type: c.type })),
        monthly_cost_per_unit: monthlyCostPerUnit,
        one_time_cost_per_unit: oneTimeCostPerUnit,
        total_monthly_cost: monthlyCostPerUnit * lineData.quantity,
        total_one_time_cost: oneTimeCostPerUnit * lineData.quantity,
        subtotal: subtotal,
        applied_rules: appliedRulesExplanation, // store for display
      }));
      setIsCalculating(false);
    };

    const calculationTimeout = setTimeout(calculate, 300);
    return () => clearTimeout(calculationTimeout);

  }, [selectedJob, lineData.quantity, lineData.nationality, lineData.contract_duration, lineData.location]);


  const CalculationResult = ({ label, value, highlight = false, currency = setupData.currency }) => (
    <div className={`flex justify-between items-center text-sm ${highlight ? 'font-bold' : ''}`}>
      <span className="text-gray-600">{label}</span>
      <span className={highlight ? 'text-emerald-700' : 'text-gray-800'}>{formatCurrency(value, currency)}</span>
    </div>
  );

  return (
    <Card className="clay-card border-none overflow-hidden">
      <CardHeader className="bg-white/30 flex-row items-center justify-between p-3">
        <h3 className="font-semibold text-gray-800">
          Service Line #{index + 1}
          {selectedJob && <span className="text-emerald-700 ml-2">- {selectedJob.job_title}</span>}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="text-red-500 hover:bg-red-100 h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Inputs */}
        <div className="space-y-4">
            <div>
              <Label htmlFor={`job-${index}`} className="flex items-center gap-2"><Briefcase className="w-4 h-4" />Service / Job Profile *</Label>
              <Select value={lineData.job_title} onValueChange={(val) => handleChange('job_title', val)}>
                <SelectTrigger id={`job-${index}`} className="clay-element border-none"><SelectValue placeholder="Select a job..." /></SelectTrigger>
                <SelectContent className="clay-card">
                    {jobProfiles.map(job => (
                        <SelectItem key={job.id} value={job.job_title}>{job.job_title}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`nat-${index}`} className="flex items-center gap-2"><Globe className="w-4 h-4" />Nationality</Label>
                  <Select value={lineData.nationality} onValueChange={(val) => handleChange('nationality', val)}>
                    <SelectTrigger id={`nat-${index}`} className="clay-element border-none"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent className="clay-card">
                      {nationalities.map(nat => <SelectItem key={nat.id} value={nat.name.toLowerCase().replace(/ /g, '_')}>{nat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div>
                    <Label htmlFor={`qty-${index}`} className="flex items-center gap-2"><Hash className="w-4 h-4" />Quantity *</Label>
                    <Input id={`qty-${index}`} type="number" min="1" value={lineData.quantity} onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 1)} className="clay-element border-none"/>
                 </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor={`dur-${index}`} className="flex items-center gap-2"><Calendar className="w-4 h-4" />Duration (Months)</Label>
                     <Select value={lineData.contract_duration} onValueChange={(val) => handleChange('contract_duration', val)}>
                        <SelectTrigger id={`dur-${index}`} className="clay-element border-none"><SelectValue /></SelectTrigger>
                        <SelectContent className="clay-card">
                            {contractDurationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor={`loc-${index}`} className="flex items-center gap-2"><MapPin className="w-4 h-4" />Location</Label>
                    <Select value={lineData.location} onValueChange={(val) => handleChange('location', val)}>
                        <SelectTrigger id={`loc-${index}`} className="clay-element border-none"><SelectValue placeholder="Any" /></SelectTrigger>
                        <SelectContent className="clay-card">
                            {cities.map(city => <SelectItem key={city.id} value={city.name.toLowerCase().replace(/ /g, '_')}>{city.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
             </div>
        </div>

        {/* Column 2 & 3: Calculation & Breakdown */}
        {selectedJob ? (
          isCalculating ? (
             <div className="lg:col-span-2 flex justify-center items-center clay-element">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
             </div>
          ) : (
            <>
            {/* Rate Calculation */}
            <div className="p-4 clay-element space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-emerald-600" />Rate Calculation</h4>
              <CalculationResult label="Base Rate / Unit" value={selectedJob.base_cost} />
              
              <div className="text-sm">
                <span className="text-gray-600">Applied Rules:</span>
                <ul className="text-gray-500 text-xs list-disc pl-4 mt-1">
                    {lineData.applied_rules && lineData.applied_rules.length > 0 ? (
                        lineData.applied_rules.map((rule, i) => (
                            <li key={i}>{rule.name}: {rule.details}</li>
                        ))
                    ) : (
                        <li>No specific pricing rules applied.</li>
                    )}
                </ul>
              </div>

              <div className="border-t border-gray-200/50 my-2"></div>
              
              <CalculationResult label="Monthly Cost / Unit" value={lineData.monthly_cost_per_unit} highlight />
              <CalculationResult label="One-Time Cost / Unit" value={lineData.one_time_cost_per_unit} highlight />
            </div>

            {/* Cost Breakdown */}
            <div className="p-4 clay-element space-y-3">
                <h4 className="font-semibold text-gray-700">Line Item Totals</h4>
                <CalculationResult label={`Total Monthly Cost (x${lineData.quantity})`} value={lineData.total_monthly_cost} />
                <CalculationResult label={`Total One-Time Cost (x${lineData.quantity})`} value={lineData.total_one_time_cost} />

                <div className="border-t border-gray-200/50 my-2"></div>
                
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Line Subtotal</span>
                    <span className="text-emerald-700">{formatCurrency(lineData.subtotal, setupData.currency)}</span>
                </div>
                 <p className="text-xs text-gray-500 text-right">
                    (Before {setupData.vatRate}% VAT)
                </p>
            </div>
            </>
          )
        ) : (
          <div className="lg:col-span-2 flex justify-center items-center clay-element">
            <p className="text-gray-500 text-center">Please select a Job Profile to begin calculation.</p>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
