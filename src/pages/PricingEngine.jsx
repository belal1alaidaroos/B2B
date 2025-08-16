
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { JobProfile } from "@/api/entities";
import { Lead } from "@/api/entities";
import { Quote } from "@/api/entities";
import { SystemSetting } from "@/api/entities";
import { PricingRule } from "@/api/entities";
import { CostComponent } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Download, Plus, Save, ListChecks, Loader2, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import JobSelector from "../components/pricing/JobSelector";
import ParametersPanel from "../components/pricing/ParametersPanel";
import CostBreakdown from "../components/pricing/CostBreakdown";
import SavedQuotes from "../components/pricing/SavedQuotes";
import ProtectedComponent, { ProtectedButton } from "../components/common/ProtectedComponent";
import PriceRequestForm from "../components/pricing/PriceRequestForm";

// Rule Evaluation Engine
const evaluateConditions = (conditions, facts, rule) => {
  // 1. Date check
  const now = new Date();
  if (rule.from_date && new Date(rule.from_date) > now) return false;
  if (rule.to_date && new Date(rule.to_date) < now) return false;

  if (!conditions || !conditions.all || conditions.all.length === 0) {
    return true;
  }

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
    
    if (factValue === undefined) {
      return false;
    }

    switch (condition.operator) {
      case 'equal':
        if (factValue != conditionValue) return false;
        break;
      case 'not_equal':
        if (factValue == conditionValue) return false;
        break;
      case 'greater_than':
        if (parseFloat(factValue) <= parseFloat(conditionValue)) return false;
        break;
      case 'less_than':
        if (parseFloat(factValue) >= parseFloat(conditionValue)) return false;
        break;
      case 'greater_than_or_equal':
        if (parseFloat(factValue) < parseFloat(conditionValue)) return false;
        break;
      case 'less_than_or_equal':
        if (parseFloat(factValue) > parseFloat(conditionValue)) return false;
        break;
      case 'in':
        const list = Array.isArray(conditionValue) ? conditionValue : String(conditionValue).split(',').map(s => s.trim());
        if (!list.includes(String(factValue))) return false;
        break;
      case 'contains':
        if (!String(factValue).includes(String(conditionValue))) return false;
        break;
      case 'starts_with':
        if (!String(factValue).startsWith(String(conditionValue))) return false;
        break;
      case 'between':
        const from = parseFloat(conditionValue?.[0]);
        const to = parseFloat(conditionValue?.[1]);
        const value = parseFloat(factValue);
        if (isNaN(from) || isNaN(to) || isNaN(value)) return false;
        if (value < from || value > to) return false;
        break;
      default:
        return false;
    }
  }

  return true;
};

// Module-level cache for system settings
let settingsCache = null;

export default function PricingEngine() {
  const [jobProfiles, setJobProfiles] = useState([]);
  const [leads, setLeads] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [costComponents, setCostComponents] = useState([]);
  
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [parameters, setParameters] = useState({
    nationality: '',
    location: '', 
    contractDuration: '12',
    quantity: 1,
  });
  const [calculation, setCalculation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vatRate, setVatRate] = useState(5);
  const [currency, setCurrency] = useState('AED');
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('');


  useEffect(() => {
    loadInitialData();
    loadFinancialSettings();
  }, []);

  useEffect(() => {
    if (selectedJob && selectedLeadId && costComponents.length > 0) { // Condition updated as per outline
      calculateCost();
    } else {
      setCalculation(null);
    }
  }, [selectedJob, parameters, selectedLeadId, pricingRules, costComponents]); // Dependencies remain the same as all affect calculation

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [profiles, leadsData, rules, components] = await Promise.all([
        JobProfile.filter({ active: true }),
        Lead.list(),
        PricingRule.filter({ is_active: true }),
        CostComponent.filter({ is_active: true }),
      ]);
      
      setJobProfiles(profiles || []);
      setLeads(leadsData || []);
      setPricingRules(rules.sort((a,b) => b.priority - a.priority) || []);
      setCostComponents(components || []);
      
      if (profiles && profiles.length > 0) {
        setSelectedJob(profiles[0]);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      setJobProfiles([]);
      setLeads([]);
      setPricingRules([]);
      setCostComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFinancialSettings = async () => {
    try {
      console.log("Loading financial settings...");
      
      if (!settingsCache) {
          console.log("Fetching settings from API...");
          settingsCache = await SystemSetting.list();
      } else {
          console.log("Using cached settings.");
      }
      const settings = settingsCache;

      console.log("All settings loaded:", settings.length);
      
      const vatRateSetting = settings.find(s => s.key === 'vat_rate');
      const currencySetting = settings.find(s => s.key === 'default_currency');
      
      console.log("VAT setting found:", vatRateSetting);
      console.log("Currency setting found:", currencySetting);

      if (vatRateSetting && vatRateSetting.value) {
        const rate = parseFloat(vatRateSetting.value);
        console.log("Parsed VAT rate:", rate);
        if (!isNaN(rate)) {
          setVatRate(rate);
          console.log("VAT rate set to:", rate);
        }
      }
      
      if (currencySetting && currencySetting.value) {
        setCurrency(currencySetting.value);
        console.log("Currency set to:", currencySetting.value);
      } else {
        console.log("No currency setting found, using default AED");
      }

    } catch (error) {
      console.error("Error loading financial settings:", error);
    }
  };

  const calculateCost = () => {
    if (!selectedJob || !selectedLeadId) {
      setCalculation(null);
      return;
    }
    setIsCalculating(true);

    const lead = leads.find(l => l.id === selectedLeadId);
    if (!lead) {
      console.warn("Selected lead not found for calculation.");
      setCalculation(null);
      setIsCalculating(false);
      return;
    }

    const facts = {
      lead: { ...lead },
      line_item: {
        job_profile_id: selectedJob.id,
        job_id: selectedJob.job_id,
        skill_level_id: selectedJob.skill_level_id,
        job_category: selectedJob.category,
        quantity: parameters.quantity,
        nationality: parameters.nationality,
        contract_duration: parseInt(parameters.contractDuration, 10),
        location: parameters.location,
        job_title: selectedJob.job_title,
      },
      base_cost: selectedJob.base_cost
    };

    const appliedComponentsMap = new Map(); // Use a Map to handle potential overrides and ensure uniqueness
    let markupPercentage = 0;
    let discountPercentage = 0;
    const appliedRulesExplanation = [];

    // 1. Evaluate "Smart" Cost Components (components with their own conditions)
    const smartComponents = costComponents.filter(c => c.conditions && c.conditions.all && c.conditions.all.length > 0);
    for (const component of smartComponents) {
        if (evaluateConditions(component.conditions, facts, component)) { // Pass component as a dummy rule for date check
            console.log(`Smart Component "${component.name}" matched.`);
            // Add component, using its own value as the applied_value
            appliedComponentsMap.set(component.id, {
                ...component,
                applied_value: component.value, 
            });
            appliedRulesExplanation.push({ name: `Smart Component: ${component.name}`, details: `Auto-applied based on its own conditions.` });
        }
    }

    // 2. Evaluate Pricing Rules
    // Rules can add components, override their values, or apply percentages.
    // Iterating by priority (already sorted from backend)
    for (const rule of pricingRules) {
      if (evaluateConditions(rule.conditions, facts, rule)) {
        console.log(`Rule "${rule.name}" matched.`);
        appliedRulesExplanation.push({ name: `Rule: ${rule.name}`, details: `Priority ${rule.priority}. Conditions met.` });
        
        for (const action of rule.actions) {
          switch (action.type) {
            case 'add_cost_component':
              const component = costComponents.find(c => c.id === action.params.component_id);
              if (component) {
                // If a rule adds a component, use its 'value' from the rule's action if provided,
                // otherwise use the component's default value. This can override a value
                // set by a 'smart' component condition or a previous rule.
                appliedComponentsMap.set(component.id, {
                  ...component,
                  applied_value: action.params.value !== undefined ? action.params.value : component.value,
                });
              }
              break;
            case 'apply_markup_percentage':
              markupPercentage += parseFloat(action.params.value || 0);
              break;
            case 'apply_discount_percentage':
              discountPercentage += parseFloat(action.params.value || 0);
              break;
            default:
              console.warn(`Unknown action type: ${action.type}`);
          }
        }
        
        if (rule.stop_if_matched) {
            console.log(`Rule "${rule.name}" triggered stop_if_matched. Halting further rule evaluation.`);
            appliedRulesExplanation.push({ name: `Halt`, details: `Stopped further rule evaluation.` });
            break; // Stop evaluating more rules
        }
      }
    }
    
    // Convert the map values to an array for easier processing
    const appliedComponents = Array.from(appliedComponentsMap.values());

    let monthlyCostPerUnit = 0;
    let oneTimeCostPerUnit = 0;

    monthlyCostPerUnit += selectedJob.base_cost;
    
    appliedComponents.forEach(comp => {
      // Use the 'applied_value' set during evaluation if available, otherwise fall back to 'value'
      let value = comp.applied_value !== undefined ? comp.applied_value : comp.value; 
      if (comp.calculation_method === 'percentage_of_base') {
        value = (selectedJob.base_cost * (value / 100));
      }
      
      if (comp.periodicity === 'monthly') {
        monthlyCostPerUnit += value;
      } else if (comp.periodicity === 'one_time') {
        oneTimeCostPerUnit += value;
      }
    });
    
    monthlyCostPerUnit = monthlyCostPerUnit * (1 + markupPercentage / 100);
    monthlyCostPerUnit = monthlyCostPerUnit * (1 - discountPercentage / 100);

    const totalMonthlyCost = monthlyCostPerUnit * parameters.quantity;
    const totalOneTimeCost = oneTimeCostPerUnit * parameters.quantity;
    
    const durationMonths = parseInt(parameters.contractDuration, 10);
    const contractSubtotal = (totalMonthlyCost * durationMonths) + totalOneTimeCost;

    const taxAmount = contractSubtotal * (vatRate / 100);
    const contractTotal = contractSubtotal + taxAmount;

    setCalculation({
      cost_breakdown: appliedComponents.map(comp => ({
        id: comp.id,
        component_name: comp.name,
        value: comp.applied_value !== undefined ? comp.applied_value : comp.value, // Ensure breakdown reflects applied_value
        periodicity: comp.periodicity,
        type: comp.type,
      })),
      monthly_cost_per_unit: monthlyCostPerUnit,
      one_time_cost_per_unit: oneTimeCostPerUnit,
      total_monthly_cost: totalMonthlyCost,
      total_one_time_cost: totalOneTimeCost,
      subtotal: contractSubtotal,
      tax_percentage: vatRate,
      tax_amount: taxAmount,
      total_amount: contractTotal,
      duration_months: durationMonths,
      markup_percentage: markupPercentage,
      discount_percentage: discountPercentage,
      base_job_cost: selectedJob.base_cost,
      applied_rules: appliedRulesExplanation,
    });

    setIsCalculating(false);
  };

  const handleSaveQuote = async () => {
    if (!calculation || !selectedLeadId || !selectedJob) {
      alert("Please select a lead and ensure a calculation is present.");
      return;
    }
    setIsSaving(true);
    const lead = leads.find(l => l.id === selectedLeadId);
    
    if (!lead) {
      alert("Selected lead not found.");
      setIsSaving(false);
      return;
    }

    const newQuoteData = {
      quote_number: `QUO-${Date.now()}`,
      lead_id: lead.id,
      client_company: lead.company_name,
      client_contact: lead.contact_person,
      status: 'draft',
      line_items: [{
        job_title: selectedJob.job_title,
        quantity: parameters.quantity,
        nationality: parameters.nationality,
        contract_duration: parameters.contractDuration,
        location: parameters.location,
        
        cost_breakdown: calculation.cost_breakdown,
        monthly_cost_per_unit: calculation.monthly_cost_per_unit,
        one_time_cost_per_unit: calculation.one_time_cost_per_unit,
        total_monthly_cost: calculation.total_monthly_cost,
        total_one_time_cost: calculation.total_one_time_cost,
      }],
      subtotal: calculation.subtotal,
      tax_percentage: vatRate,
      tax_amount: calculation.tax_amount,
      total_amount: calculation.total_amount,
      terms_conditions: "Standard terms and conditions apply."
    };

    try {
      const newQuote = await Quote.create(newQuoteData);
      alert(`Quote ${newQuote.quote_number} created successfully!`);
    } catch (error) {
      console.error("Failed to save quote:", error);
      alert("Failed to save quote. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestSuccess = (newRequest) => {
    setIsRequestFormOpen(false);
    setRequestSuccessMessage(`Your price request (ID: ${newRequest.id}) has been submitted successfully.`);
    setTimeout(() => setRequestSuccessMessage(''), 5000);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Pricing Engine</h1>
          <p className="text-sm text-gray-600">Dynamically calculate project costs and generate quotes (VAT: {vatRate}% | Currency: {currency}).</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("JobProfiles")}>
            <Button variant="outline" className="clay-button">
              <ListChecks className="w-4 h-4 mr-2" />
              Manage Job Profiles
            </Button>
          </Link>
        </div>
      </div>
      
      {requestSuccessMessage && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl relative mb-4" role="alert">
          <strong className="font-bold">Success! </strong>
          <span className="block sm:inline">{requestSuccessMessage}</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <JobSelector 
            jobProfiles={jobProfiles}
            selectedJob={selectedJob}
            onJobSelect={setSelectedJob}
            isLoading={isLoading}
          />

          {selectedJob && (
            <ProtectedComponent module="pricing_engine" action="use" fallback={<p className="p-4 text-center text-gray-600 clay-card">You do not have permission to use the pricing engine.</p>}>
              <>
                <Card className="clay-card border-none">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      Select Lead & Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="lead-select">Select Lead</Label>
                      <Select value={selectedLeadId || ""} onValueChange={setSelectedLeadId}>
                        <SelectTrigger id="lead-select" className="clay-element border-none">
                          <SelectValue placeholder="Choose a lead to trigger calculation..." />
                        </SelectTrigger>
                        <SelectContent className="clay-card">
                          {leads.map(lead => (
                            <SelectItem key={lead.id} value={lead.id}>
                              {lead.company_name} - {lead.contact_person}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <ParametersPanel
                      parameters={parameters}
                      onParametersChange={setParameters}
                    />
                  </CardContent>
                </Card>

                {isCalculating ? (
                    <div className="flex flex-col justify-center items-center p-8 clay-card min-h-[200px]">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <p className="ml-4 mt-3 text-gray-600">Calculating cost based on rules...</p>
                    </div>
                ) : calculation && selectedLeadId ? (
                    <>
                      <CostBreakdown 
                          calculation={calculation}
                          quantity={parameters.quantity}
                          currency={currency}
                          vatRate={vatRate}
                      />
                      
                      <Card className="clay-card border-none">
                         <CardHeader className="pb-4">
                           <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                             <Save className="w-5 h-5 text-emerald-600" />
                             Actions
                           </CardTitle>
                         </CardHeader>
                         <CardContent className="flex flex-col sm:flex-row gap-3">
                            <ProtectedButton module="quotes" action="create">
                               <Button 
                                 onClick={handleSaveQuote}
                                 disabled={isSaving || isCalculating}
                                 className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 w-full"
                               >
                                 {isSaving ? 'Creating Quote...' : `Create Quote & Save Draft`}
                               </Button>
                            </ProtectedButton>
                            <ProtectedButton module="price_requests" action="create">
                               <Button 
                                 variant="outline"
                                 onClick={() => setIsRequestFormOpen(true)}
                                 disabled={isSaving || isCalculating}
                                 className="clay-button bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 w-full"
                               >
                                 Request Special Price
                               </Button>
                            </ProtectedButton>
                         </CardContent>
                      </Card>
                    </>
                ) : (
                  <div className="flex flex-col justify-center items-center p-8 clay-card min-h-[200px]">
                      <Calculator className="w-8 h-8 text-gray-400 mb-3" />
                      <p className="text-gray-500 text-center">Select a lead and adjust parameters to see the cost calculation.</p>
                  </div>
                )}
              </>
            </ProtectedComponent>
          )}
        </div>

        <div className="space-y-4">
          <SavedQuotes />
        </div>
      </div>
      
      <Dialog open={isRequestFormOpen} onOpenChange={setIsRequestFormOpen}>
        <DialogContent className="sm:max-w-[600px] clay-card">
          <DialogHeader>
            <DialogTitle>Request Special Price from Finance</DialogTitle>
            <DialogDescription>
              Fill out the details below to submit a formal request for a custom price to the finance department.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedLeadId && selectedJob && (
              <PriceRequestForm
                lead={leads.find(l => l.id === selectedLeadId)}
                jobProfile={selectedJob}
                parameters={parameters}
                onSuccess={handleRequestSuccess}
                onCancel={() => setIsRequestFormOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
