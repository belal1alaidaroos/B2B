
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Receipt,
  CheckCircle,
  XCircle,
  Plus,
  Zap,
  Lock,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PriceRequestModal from './PriceRequestModal';
import { User } from '@/api/entities';
import { usePermissions } from '@/components/hooks/usePermissions';

const formatCurrency = (value, currency = 'AED') => {
  if (value === null || value === undefined || isNaN(value)) {
    value = 0;
  }
  const currencySymbols = {
    'AED': 'د.إ', 'SAR': 'ر.س', 'USD': '$', 'EUR': '€', 'GBP': '£'
  };
  const symbol = currencySymbols[currency] || currency;
  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${symbol}`;
};

export default function QuoteLineItemBuilder({ 
  quote, 
  onLineItemsChange, 
  currency,
  vatRate = 5,
  lookupData,
  isLoading    
}) {
  const [showPriceRequestModal, setShowPriceRequestModal] = useState(false);
  const [selectedLineItemForPricing, setSelectedLineItemForPricing] = useState(null);
  const { currentUser } = usePermissions();

  const addNewLineItem = () => {
    const newLineItem = {
      id: `temp_${Date.now()}`,
      job_profile_id: '',
      nationality_id: '',
      quantity: 1,
      contract_duration: '12',
      manual_discount_percentage: 0,
      manual_discount_amount: 0,
      line_subtotal: 0,
      line_discount_status: 'none'
    };
    const updatedLineItems = [...(quote?.line_items || []), newLineItem];
    onLineItemsChange(updatedLineItems);
  };

  const removeLineItem = (lineItemId) => {
    const updatedLineItems = (quote?.line_items || []).filter(item => item.id !== lineItemId);
    onLineItemsChange(updatedLineItems);
  };

  const updateLineItem = (lineItemId, updatedData) => {
    const updatedLineItems = (quote?.line_items || []).map(item => 
      item.id === lineItemId ? { ...item, ...updatedData } : item
    );
    onLineItemsChange(updatedLineItems);
  };

  const handlePriceRequest = (lineItem) => {
    setSelectedLineItemForPricing(lineItem);
    setShowPriceRequestModal(true);
  };

  const handlePriceRequestSuccess = (createdRequest) => {
    console.log('Price request created successfully:', createdRequest);
    setShowPriceRequestModal(false);
    setSelectedLineItemForPricing(null);
  };

  if (isLoading) {
    return (
      <Card className="clay-card">
        <CardHeader><CardTitle>Loading pricing data...</CardTitle></CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </CardContent>
      </Card>
    );
  }

  const lineItems = quote?.line_items || [];

  return (
    <div className="space-y-4">
      <Card className="clay-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Line Items ({lineItems.length})
            </CardTitle>
            <Button onClick={addNewLineItem} className="clay-button">
              <Plus className="w-4 h-4 mr-2" />
              Add Line Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No line items added yet</p>
              <p className="text-sm">Click "Add Line Item" to start building your quote.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lineItems.map((lineItem, index) => (
                <QuoteLineItem
                  key={lineItem.id}
                  lineItem={lineItem || {}}
                  index={index}
                  lookupData={lookupData}
                  currency={currency}
                  vatRate={vatRate}
                  quote={quote}
                  onUpdate={updateLineItem}
                  onRemove={removeLineItem}
                  onPriceRequest={handlePriceRequest}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price Request Modal */}
      <PriceRequestModal
        isOpen={showPriceRequestModal}
        onClose={() => {
          setShowPriceRequestModal(false);
          setSelectedLineItemForPricing(null);
        }}
        lineItem={selectedLineItemForPricing}
        quote={quote}
        currentUser={currentUser}
        onSuccess={handlePriceRequestSuccess}
      />
    </div>
  );
}

function QuoteLineItem({ 
  lineItem = {}, 
  index, 
  lookupData, 
  currency, 
  vatRate,
  quote,
  onUpdate, 
  onRemove,
  onPriceRequest
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // REFINED LOCKING LOGIC: Any applied discount protects the item.
  const isLocked = (lineItem.effective_discount_percentage || 0) > 0;
  
  // REFINED PRICE REQUEST LOGIC: Button is always available if the item is not locked.
  const showPriceRequestButton = !isLocked;

  let appliedDiscountSource = 'none';
  if ((lineItem.manual_discount_percentage || 0) > 0 && lineItem.line_discount_status === 'approved') {
    appliedDiscountSource = 'individual';
  } else if ((quote?.overall_discount_percentage || 0) > 0 && quote.discount_status === 'approved') {
    appliedDiscountSource = 'overall';
  }

  const handleFieldChange = (field, value) => {
    if (isLocked) return;
    
    const updatedData = { [field]: value };
    if (field === 'job_profile_id' && value) {
      const jobProfile = lookupData.jobProfiles?.find(jp => jp.id === value);
      if (jobProfile) {
        updatedData.job_profile_title = jobProfile.job_title || '';
      }
    } else if (field === 'nationality_id' && value) {
        const nationality = lookupData.nationalities?.find(n => n.id === value);
        if (nationality) {
            updatedData.nationality = nationality.name || '';
        }
    }
    onUpdate(lineItem.id, updatedData);
  };

  const handleRemove = () => {
    if (isLocked) return;
    onRemove(lineItem.id);
  };

  const getLockReason = () => {
    if (isLocked) {
      return "This item is protected due to an approved discount applied to it. To make changes, you must first cancel the discount.";
    }
    return "";
  };

  const getDiscountDisplayInfo = () => {
    if (!isLocked) return { badge: null, note: "" };

    const effectiveDiscount = lineItem.effective_discount_percentage || 0;
    
    if (appliedDiscountSource === 'individual') {
      return {
        badge: <Badge className="bg-blue-100 text-blue-800 border-blue-300">Individual Discount: {effectiveDiscount}%</Badge>,
        note: "An approved individual discount has been applied to this item."
      };
    } else if (appliedDiscountSource === 'overall') {
      return {
        badge: <Badge className="bg-green-100 text-green-800 border-green-300">Overall Discount Applied: {effectiveDiscount}%</Badge>,
        note: "The approved overall discount has been applied to this item."
      };
    }
    
    return { badge: null, note: "" };
  };

  const discountInfo = getDiscountDisplayInfo();
  
  return (
    <Card className={`clay-card border-l-4 ${isLocked ? 'border-l-yellow-500 bg-yellow-50/30' : 'border-l-emerald-500'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>Line Item #{index + 1} - {lineItem.job_profile_title || 'New Item'}</CardTitle>
            {isLocked && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                <Lock className="w-3 h-3 mr-1" />
                Protected
              </Badge>
            )}
            {discountInfo.badge}
            
            {showPriceRequestButton && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPriceRequest(lineItem)}
                className="clay-button bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Request Special Pricing
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge>
              {formatCurrency(lineItem.line_grand_total || 0, currency)}
            </Badge>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemove}
              disabled={isLocked}
              className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
              title={isLocked ? 'Cannot delete due to applied discount' : 'Delete item'}
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
        {isLocked && (
          <Alert className="mt-2 bg-yellow-50 border-yellow-200">
            <Lock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              {getLockReason()}
            </AlertDescription>
          </Alert>
        )}
        
        {discountInfo.note && (
          <div className="mt-2 text-sm text-gray-600">
            💡 {discountInfo.note}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3 items-end">
            <div className="col-span-2 md:col-span-2">
                <Label htmlFor={`job_profile_${lineItem.id}`} className="text-xs">Job Profile *</Label>
                <Select 
                  value={lineItem.job_profile_id || ''} 
                  onValueChange={v => handleFieldChange('job_profile_id', v)}
                  disabled={isLocked}
                >
                    <SelectTrigger 
                      id={`job_profile_${lineItem.id}`}
                      className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>{(lookupData.jobProfiles || []).map(p => (<SelectItem key={p.id} value={p.id}>{p.job_title}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="col-span-1">
                <Label htmlFor={`nationality_${lineItem.id}`} className="text-xs">Nationality *</Label>
                <Select 
                  value={lineItem.nationality_id || ''} 
                  onValueChange={v => handleFieldChange('nationality_id', v)}
                  disabled={isLocked}
                >
                    <SelectTrigger 
                      id={`nationality_${lineItem.id}`}
                      className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                    >
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>{(lookupData.nationalities || []).map(n => (<SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="col-span-1">
                <Label htmlFor={`quantity_${lineItem.id}`} className="text-xs">Qty</Label>
                <Input 
                  id={`quantity_${lineItem.id}`} 
                  type="number" 
                  min="1" 
                  value={lineItem.quantity || 1} 
                  onChange={e => handleFieldChange('quantity', e.target.value)}
                  disabled={isLocked}
                  className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
            </div>
            <div className="col-span-1">
                <Label htmlFor={`contract_${lineItem.id}`} className="text-xs">Term (m)</Label>
                <Input 
                  id={`contract_${lineItem.id}`} 
                  type="number" 
                  min="1" 
                  value={lineItem.contract_duration || 12} 
                  onChange={e => handleFieldChange('contract_duration', e.target.value)}
                  disabled={isLocked}
                  className={isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}
                />
            </div>
            <div className="col-span-1">
                <Label htmlFor={`discount_perc_${lineItem.id}`} className="text-xs">Applied %</Label>
                <Input 
                  id={`discount_perc_${lineItem.id}`} 
                  type="number" 
                  value={lineItem.effective_discount_percentage || 0} 
                  readOnly 
                  className="bg-gray-100 focus:ring-0" 
                />
            </div>
            <div className="col-span-1">
                <Label htmlFor={`discount_amt_${lineItem.id}`} className="text-xs">Applied Amt</Label>
                <Input 
                  id={`discount_amt_${lineItem.id}`} 
                  type="text" 
                  value={formatCurrency(lineItem.applied_discount_amount || 0, currency)} 
                  readOnly 
                  className="bg-gray-100 focus:ring-0" 
                />
            </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between mt-2">
                <span className="flex items-center gap-2"><Receipt /><strong>Detailed Cost Breakdown</strong></span>
                {isExpanded ? <ChevronUp/> : <ChevronDown/>}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
                <div className="p-4 rounded-lg bg-gray-50 border">
                    <h4 className="font-bold mb-2">Cost Components Breakdown</h4>
                    <div className="space-y-3">
                    {(lineItem.cost_breakdown || []).map((c, i) => (
                        <div key={i} className={`p-3 rounded-lg border-l-4 ${c.is_base_cost ? 'bg-blue-50 border-blue-500' : 'bg-green-50 border-green-500'}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h5 className="font-bold">{c.name}</h5>
                                    {!c.is_base_cost && (
                                    <div className="flex gap-1 mt-1">
                                        <Badge variant="secondary">{c.type}</Badge>
                                        <Badge variant="secondary">{c.periodicity}</Badge>
                                    </div>
                                    )}
                                </div>
                                <p className="font-bold text-lg">{formatCurrency(c.grand_total, currency)}</p>
                            </div>
                            <Separator className="my-2"/>
                            <div className="grid md:grid-cols-2 gap-x-4 text-sm">
                                <div>
                                    <p className="flex justify-between"><span>Subtotal:</span><span className="font-semibold">{formatCurrency(c.subtotal, currency)}</span></p>
                                    <p className="flex justify-between text-red-600"><span>Discount ({lineItem.effective_discount_percentage || 0}%):</span><span>-{formatCurrency(c.discount_amount, currency)}</span></p>
                                </div>
                                <div>
                                    <p className="flex justify-between"><span>Subtotal After Disc:</span><span className="font-semibold">{formatCurrency(c.subtotal - c.discount_amount, currency)}</span></p>
                                    <p className="flex justify-between"><span>VAT ({c.vat_applicable === false ? '0' : vatRate}%):</span><span>{formatCurrency(c.vat_amount, currency)}</span></p>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>

                {lineItem.applied_rules?.length > 0 && (
                    <div className="p-4 rounded-lg bg-amber-50 border-l-4 border-amber-500">
                    <h4 className="font-bold mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Applied Rules</h4>
                    <ul className="space-y-1 text-sm list-disc pl-5">{lineItem.applied_rules.map((r,i) => (<li key={i}><span className="font-semibold">{r.rule_name}:</span> {r.explanation}</li>))}</ul>
                    </div>
                )}

                <div className="p-4 rounded-lg bg-gray-100 border-l-4 border-gray-400">
                    <h4 className="font-bold mb-2">Final Line Item Calculation</h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="flex justify-between"><span>Total Subtotal Before Discount:</span> <span>{formatCurrency(lineItem.subtotal_before_discount || 0, currency)}</span></p>
                        <p className="flex justify-between text-red-600"><span>Total Applied Discount ({lineItem.effective_discount_percentage || 0}%):</span> <span>-{formatCurrency(lineItem.applied_discount_amount || 0, currency)}</span></p>
                        <p className="flex justify-between font-semibold border-t pt-1"><span>Total Subtotal After Discount:</span> <span>{formatCurrency(lineItem.line_subtotal || 0, currency)}</span></p>
                    </div>
                    <div className="space-y-1">
                        <p className="flex justify-between"><span>Total VAT Amount:</span> <span>{formatCurrency(lineItem.line_vat_amount || 0, currency)}</span></p>
                        <p className="flex justify-between font-bold text-lg text-emerald-800 border-t pt-1"><span>Line Grand Total:</span> <span>{formatCurrency(lineItem.line_grand_total || 0, currency)}</span></p>
                    </div>
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
