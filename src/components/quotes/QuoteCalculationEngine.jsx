
import { JobProfile } from '@/api/entities';
import { Job } from '@/api/entities';
import { SkillLevel } from '@/api/entities';
import { CostComponent } from '@/api/entities';
import { Nationality } from '@/api/entities';
import { City } from '@/api/entities';
import { PricingRule } from '@/api/entities';

export const evaluateConditions = (conditions, facts) => {
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
      case 'in':
        const list = Array.isArray(conditionValue) ? conditionValue : String(conditionValue).split(',').map(s => s.trim());
        if (!list.includes(String(factValue))) return false;
        break;
      case 'contains': if (!String(factValue).includes(String(conditionValue))) return false; break;
      case 'starts_with': if (!String(factValue).startsWith(String(conditionValue))) return false; break;
      default: return false;
    }
  }
  return true;
};

export const calculateLineItemCost = (lineItem, quoteData, vatRate, lookupData) => {
  if (!lookupData || !lookupData.jobProfiles || !lineItem.job_profile_id) {
    return lineItem;
  }
  
  const jobProfile = lookupData.jobProfiles.find(jp => jp.id === lineItem.job_profile_id);
  if (!jobProfile) {
    return lineItem;
  }

  // Destructure lineItem to exclude location_city_id when creating facts
  const { location_city_id, ...lineItemWithoutLocationCityId } = lineItem;
  const facts = {
    line_item: { 
      ...lineItemWithoutLocationCityId, 
      quantity: parseInt(lineItem.quantity) || 1, 
      contract_duration: parseInt(lineItem.contract_duration) || 12 
    }
  };

  // --- FINAL CORRECTED DISCOUNT LOGIC ---
  // Priority order:
  // 1. Individual line item discount takes absolute priority over overall discount
  // 2. Overall discount applies ONLY to items that were eligible when it was approved
  // 3. New line items (created after overall discount approval) NEVER get overall discount
  // 4. Items must be explicitly marked as eligible for overall discount

  const hasIndividualDiscount = lineItem.line_discount_status === 'approved' && 
                               (lineItem.manual_discount_percentage || 0) > 0;
  
  const hasOverallDiscount = quoteData?.discount_status === 'approved' && 
                            (quoteData.overall_discount_percentage || 0) > 0;

  // NEW: Check if this line item is eligible for overall discount
  // This flag should be set when overall discount is first approved
  const isEligibleForOverallDiscount = lineItem.eligible_for_overall_discount === true;
  
  let effectiveDiscountPercentage = 0;
  
  if (hasIndividualDiscount) {
    // Individual line item discount takes absolute priority
    effectiveDiscountPercentage = lineItem.manual_discount_percentage || 0;
  } else if (hasOverallDiscount && isEligibleForOverallDiscount) {
    // Overall discount applies ONLY to items that were marked as eligible
    effectiveDiscountPercentage = quoteData.overall_discount_percentage || 0;
  }
  // New items or items not marked as eligible get no overall discount
  // --- END OF FINAL CORRECTED LOGIC ---

  const componentsFromRules = [];
  const appliedRules = [];
  let markupPercentage = 0;
  let ruleDiscountPercentage = 0;

  if (lookupData.pricingRules) {
    for (const rule of lookupData.pricingRules) {
      if (evaluateConditions(rule.conditions, facts)) {
        appliedRules.push({ rule_id: rule.id, rule_name: rule.name || '', explanation: `Applied rule: ${rule.name || 'Unknown Rule'}` });
        if (rule.actions) {
          rule.actions.forEach(action => {
            if (action.type === 'add_cost_component') {
              const comp = lookupData.costComponents?.find(c => c.id === action.params?.component_id);
              if(comp) componentsFromRules.push(comp);
            } else if (action.type === 'apply_markup_percentage') markupPercentage += parseFloat(action.params?.value || 0);
            else if (action.type === 'apply_discount_percentage') ruleDiscountPercentage += parseFloat(action.params?.value || 0);
          });
        }
        if (rule.stop_if_matched) break;
      }
    }
  }

  const defaultComponentIds = [
    ...(jobProfile.default_cost_components || []),
    ...(lookupData.nationalities?.find(n => n.id === lineItem.nationality_id)?.default_cost_components || [])
  ];
  
  const allRawComponents = [
      ...componentsFromRules,
      ...lookupData.costComponents.filter(c => defaultComponentIds.includes(c.id))
  ];
  const uniqueComponents = Array.from(new Map(allRawComponents.map(item => [item.id, item])).values());

  const quantity = parseInt(lineItem.quantity) || 1;
  const contractDuration = parseInt(lineItem.contract_duration) || 12;
  const processedBreakdown = [];
  let totalSubtotalBeforeDiscount = 0;
  let totalAppliedDiscount = 0;
  let totalVat = 0;

  const baseCostMonthly = jobProfile.base_cost || 0;
  let finalBaseCostMonthly = baseCostMonthly * (1 + markupPercentage / 100) * (1 - ruleDiscountPercentage / 100);
  
  const baseCostSubtotal = finalBaseCostMonthly * contractDuration * quantity;
  const baseCostDiscountAmount = baseCostSubtotal * (effectiveDiscountPercentage / 100);
  const baseCostAfterDiscount = baseCostSubtotal - baseCostDiscountAmount;
  const baseCostVatAmount = baseCostAfterDiscount * (vatRate / 100);

  totalSubtotalBeforeDiscount += baseCostSubtotal;
  totalAppliedDiscount += baseCostDiscountAmount;
  totalVat += baseCostVatAmount;

  processedBreakdown.push({
      is_base_cost: true,
      name: `Base Monthly Cost: ${jobProfile.job_title}`,
      subtotal: baseCostSubtotal,
      discount_amount: baseCostDiscountAmount,
      vat_amount: baseCostVatAmount,
      grand_total: baseCostAfterDiscount + baseCostVatAmount,
      original_base_cost_per_unit: baseCostMonthly,
      final_base_cost_per_unit_after_rules: finalBaseCostMonthly,
      quantity: quantity,
      contract_duration: contractDuration,
      vat_applicable: true,
      vat_rate: vatRate
  });

  uniqueComponents.forEach(comp => {
    let value = comp.value || 0;
    if (comp.calculation_method === 'percentage_of_base') {
      value = (baseCostMonthly * (value / 100));
    }

    const periodicityMultiplier = comp.periodicity === 'monthly' ? contractDuration : 1;
    const compSubtotal = value * periodicityMultiplier * quantity;

    const compDiscountAmount = compSubtotal * (effectiveDiscountPercentage / 100);
    const compAfterDiscount = compSubtotal - compDiscountAmount;
    const compVatAmount = comp.vat_applicable ? (compAfterDiscount * (vatRate / 100)) : 0;
    
    totalSubtotalBeforeDiscount += compSubtotal;
    totalAppliedDiscount += compDiscountAmount;
    totalVat += compVatAmount;
    
    processedBreakdown.push({
        ...comp,
        is_base_cost: false,
        name: comp.name || '',
        subtotal: compSubtotal,
        discount_amount: compDiscountAmount,
        vat_amount: compVatAmount,
        grand_total: compAfterDiscount + compVatAmount,
        calculated_value_per_unit: value,
        quantity: quantity,
        contract_duration: contractDuration,
        vat_rate: comp.vat_applicable ? vatRate : 0
    });
  });

  const subtotalAfterDiscount = totalSubtotalBeforeDiscount - totalAppliedDiscount;
  const grandTotal = subtotalAfterDiscount + totalVat;

  return {
    ...lineItem,
    cost_breakdown: processedBreakdown,
    applied_rules: appliedRules,
    subtotal_before_discount: totalSubtotalBeforeDiscount,
    effective_discount_percentage: effectiveDiscountPercentage,
    applied_discount_amount: totalAppliedDiscount,
    line_subtotal: subtotalAfterDiscount,
    line_vat_amount: totalVat,
    line_grand_total: grandTotal,
  };
};

export const calculateQuoteTotals = (lineItems) => {
    if (!lineItems || lineItems.length === 0) {
      return {
        subtotal: 0,
        overall_discount_amount: 0,
        tax_amount: 0,
        total_amount: 0,
      };
    }
  
    const subtotalSum = lineItems.reduce((sum, item) => sum + (item.subtotal_before_discount || 0), 0);
    const discountSum = lineItems.reduce((sum, item) => sum + (item.applied_discount_amount || 0), 0);
    const vatSum = lineItems.reduce((sum, item) => sum + (item.line_vat_amount || 0), 0);
    const grandTotalSum = lineItems.reduce((sum, item) => sum + (item.line_grand_total || 0), 0);
  
    return {
      subtotal: subtotalSum,
      overall_discount_amount: discountSum,
      tax_amount: vatSum,
      total_amount: grandTotalSum,
    };
};
