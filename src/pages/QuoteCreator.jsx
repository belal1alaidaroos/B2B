
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Quote } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Opportunity } from '@/api/entities';
import { User } from '@/api/entities';
import { SystemSetting } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Save,
  Send,
  Plus,
  Trash2,
  Calculator,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Percent,
  XCircle,
  ChevronDown,
  ChevronUp,
  Paperclip,
  DollarSign,
  Tag,
  Target,
  Users,
  Mail,
  ArrowLeft,
  Info,
  Receipt,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

import QuoteLineItemBuilder from '../components/quotes/QuoteLineItemBuilder';
import QuoteAttachments from '../components/quotes/QuoteAttachments';
import DiscountApprovalSection from '../components/quotes/DiscountApprovalSection';

// New Imports for Calculation Engine and Lookup Data
import { JobProfile } from '@/api/entities';
import { PricingRule } from '@/api/entities';
import { CostComponent } from '@/api/entities';
import { Nationality } from '@/api/entities';
import { calculateLineItemCost, calculateQuoteTotals } from '../components/quotes/QuoteCalculationEngine';
import { ApprovalService, submitForApproval } from '@/components/common/ApprovalService';
import { logAuditEvent } from '@/components/common/AuditService';
import { usePermissions } from '@/components/hooks/usePermissions';

const formatCurrency = (value, currency = 'AED') => {
    if (value === null || value === undefined) {
      value = 0;
    }
    const currencySymbols = {
        'AED': 'د.إ', 'SAR': 'ر.س', 'USD': '$', 'EUR': '€', 'GBP': '£'
    };
    const symbol = currencySymbols[currency] || currency;
    return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ${symbol}`;
};

export default function QuoteCreatorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: permissionsCurrentUser, canCreate, canUpdate, isLoading: permissionsLoading } = usePermissions();

  const [quote, setQuote] = useState(null);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [vatRate, setVatRate] = useState(5);
  const [currency, setCurrency] = useState('AED');
  const [message, setMessage] = useState(null);
  const [expandedLineItems, setExpandedLineItems] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentsDialog, setShowAttachmentsDialog] = useState(false);
  const [showMissingSourceWarning, setShowMissingSourceWarning] = useState(false);
  const [linkedSource, setLinkedSource] = useState(null);
  const [lookupData, setLookupData] = useState(null);

  const getRecalculatedQuote = useCallback((rawQuote) => {
    if (!lookupData || !rawQuote) {
      return rawQuote;
    }

    const recalculatedLineItems = (rawQuote.line_items || []).map(item =>
      calculateLineItemCost(item, rawQuote, vatRate, lookupData)
    );

    const finalTotals = calculateQuoteTotals(recalculatedLineItems);

    const finalQuote = {
      ...rawQuote,
      line_items: recalculatedLineItems,
      ...finalTotals,
      tax_percentage: vatRate,
    };
    
    return finalQuote;
  }, [lookupData, vatRate]);

  useEffect(() => {
    if (quote && lookupData) {
      const recalculated = getRecalculatedQuote(quote);
      if (JSON.stringify(recalculated) !== JSON.stringify(quote)) {
        setQuote(recalculated);
      }
    }
  }, [quote, lookupData, vatRate, getRecalculatedQuote]);

  useEffect(() => {
    if (!permissionsLoading) {
        loadInitialData();
        
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('warning') === 'missing_source') {
            setShowMissingSourceWarning(true);
        }
    }
  }, [permissionsLoading]);

  const getQuoteId = () => {
    const params = new URLSearchParams(location.search);
    return params.get('id');
  };

  const toggleLineItemExpansion = (lineItemId) => {
    setExpandedLineItems(prev => ({
      ...prev,
      [lineItemId]: !prev[lineItemId]
    }));
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        leadsData,
        settings,
        jobProfiles,
        pricingRules,
        costComponents,
        nationalities
      ] = await Promise.all([
        Lead.list(),
        SystemSetting.list(),
        JobProfile.filter({ active: true }),
        PricingRule.filter({ is_active: true }),
        CostComponent.filter({ is_active: true }),
        Nationality.filter({ is_active: true })
      ]);

      setLeads(leadsData);

      const newLookupData = {
          jobProfiles: jobProfiles || [],
          pricingRules: (pricingRules || []).sort((a, b) => b.priority - a.priority),
          costComponents: costComponents || [],
          nationalities: nationalities || []
      };
      setLookupData(newLookupData);

      const vatSetting = settings.find(s => s.key === 'vat_rate');
      const currencySetting = settings.find(s => s.key === 'default_currency');
      const currentVatRate = parseFloat(vatSetting?.value) || 5;
      
      if (vatSetting) setVatRate(currentVatRate);
      if (currencySetting) setCurrency(currencySetting.value || 'AED');

      const quoteId = getQuoteId();
      if (quoteId) {
        const existingQuote = await Quote.filter({ id: quoteId });
        if (existingQuote.length > 0) {
          let quoteToSet = existingQuote[0];
          
          if (!quoteToSet.lead_id && !quoteToSet.opportunity_id) {
            console.warn('Warning: This quote is not linked to any Lead or Opportunity. This may affect sales tracking.');
          }
          
          if (!quoteToSet.creator_user_id && permissionsCurrentUser) {
            console.log('Quote missing creator_user_id, setting to current user:', permissionsCurrentUser.id);
            quoteToSet = {
              ...quoteToSet,
              creator_user_id: permissionsCurrentUser.id
            };
            try {
              const updatedQuote = await Quote.update(quoteId, { creator_user_id: permissionsCurrentUser.id });
              quoteToSet = updatedQuote;
            } catch (error) {
              console.error('Failed to update quote with creator_user_id:', error);
            }
          }
          
          setQuote(quoteToSet);
          setAttachments(quoteToSet.attachments || []);

          if (quoteToSet.opportunity_id) {
              const opportunityData = await Opportunity.filter({ id: quoteToSet.opportunity_id });
              if (opportunityData.length > 0) {
                  setLinkedSource({ type: 'opportunity', data: opportunityData[0] });
              }
          } else if (quoteToSet.lead_id) {
              const leadDataFromDB = await Lead.filter({ id: quoteToSet.lead_id });
              if (leadDataFromDB.length > 0) {
                  setLinkedSource({ type: 'lead', data: leadDataFromDB[0] });
              }
          }

          const initialExpanded = {};
          quoteToSet.line_items?.forEach(item => {
            initialExpanded[item.id] = false;
          });
          setExpandedLineItems(initialExpanded);
        } else {
          setMessage({ type: 'error', text: 'Quote not found.' });
        }
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const leadId = urlParams.get('lead_id');
        const opportunityId = urlParams.get('opportunity_id');
        
        if (opportunityId) {
            const opportunityData = await Opportunity.filter({ id: opportunityId });
            if (opportunityData.length > 0) {
                const opp = opportunityData[0];
                setLinkedSource({ type: 'opportunity', data: opp });
                if (opp.lead_id) {
                  const originalLead = leadsData.find(l => l.id === opp.lead_id);
                  if (originalLead) {
                     setLeads(prev => {
                       if (prev.find(l => l.id === originalLead.id)) return prev;
                       return [...prev, originalLead];
                     });
                  }
                }
            }
        } else if (leadId) {
            const leadData = leadsData.find(l => l.id === leadId);
            if (leadData) {
                setLinkedSource({ type: 'lead', data: leadData });
            }
        }

        let clientCompany = '';
        let clientContact = '';
        
        if (leadId) {
          const leadData = leadsData.find(l => l.id === leadId);
          if (leadData) {
            clientCompany = leadData.company_name;
            clientContact = leadData.contact_person;
          }
        }

        const newQuote = {
          quote_number: `QUO-${Date.now()}`,
          client_company: clientCompany,
          client_contact: clientContact,
          lead_id: leadId || '',
          opportunity_id: opportunityId || '',
          creator_user_id: permissionsCurrentUser?.id,
          status: 'draft',
          effective_date: new Date().toISOString().split('T')[0],
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          line_items: [],
          subtotal: 0,
          tax_percentage: currentVatRate,
          tax_amount: 0,
          total_amount: 0,
          overall_discount_percentage: 0,
          overall_discount_amount: 0,
          discount_status: 'none',
          discount_request_notes: '',
          discount_approver_id: '',
          discount_decision_date: '',
          discount_approval_notes: '',
          required_overall_approver_role_id: '',
          terms_conditions: 'Standard terms and conditions apply.',
          notes: '',
          attachments: [],
          overall_discount_applied_to_items: [] // Initialize new field
        };
        setQuote(newQuote);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setMessage({ type: 'error', text: 'Failed to load data. Please refresh the page.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOverallQuoteStatus = (currentQuote) => {
    const quoteCopy = { ...currentQuote };

    const isOverallPending = quoteCopy.discount_status === 'pending_approval';
    const areAnyLinesPending = quoteCopy.line_items?.some(
      item => item.line_discount_status === 'pending_approval'
    );

    if (isOverallPending || areAnyLinesPending) {
      quoteCopy.status = 'pending_approval';
    } else if (quoteCopy.status === 'pending_approval') {
      if (!isOverallPending && !areAnyLinesPending) {
        quoteCopy.status = 'draft';
      }
    }

    return quoteCopy;
  };

  const handleQuoteFieldChange = (field, value) => {
    setQuote(prev => {
        const newQuote = { ...prev, [field]: value };
        if (field === 'lead_id') {
            const selectedLead = leads.find(l => l.id === value);
            if (selectedLead) {
                newQuote.client_company = selectedLead.company_name;
                newQuote.client_contact = selectedLead.contact_person;
                setLinkedSource({ type: 'lead', data: selectedLead });
            } else {
                setLinkedSource(null);
            }
            newQuote.opportunity_id = '';
        } else if (field === 'opportunity_id') {
            newQuote.lead_id = '';
            setLinkedSource(null);
        }
        return newQuote;
    });
  };

  const handleLineItemsChange = (newLineItems) => {
    setQuote(prev => {
      const newQuote = { ...prev, line_items: newLineItems };
      const newExpanded = {};
      newLineItems.forEach(item => {
        newExpanded[item.id] = expandedLineItems[item.id] || false;
      });
      setExpandedLineItems(newExpanded);
      return newQuote;
    });
  };

  const handleSaveQuote = async (quoteToSave, showMessage = true) => {
    if (!quoteToSave.lead_id && !quoteToSave.opportunity_id) {
      setMessage({ 
        type: 'error', 
        text: 'Quote must be linked to either a Lead or an Opportunity for proper sales tracking. Please go back and create quote from Lead or Opportunity page.' 
      });
      return null;
    }

    if (!quoteToSave?.client_company || !quoteToSave?.client_contact) {
      setMessage({ type: 'error', text: 'Please fill in client company and contact information.' });
      return null;
    }

    setIsSaving(true);
    try {
      let savedQuote;
      const quoteId = quoteToSave.id || getQuoteId();

      const finalQuoteToSave = {
        ...updateOverallQuoteStatus(quoteToSave),
        attachments
      };

      let actionType = quoteId ? 'update_quote' : 'create_quote';

      if (quoteId) {
        savedQuote = await Quote.update(quoteId, finalQuoteToSave);
      } else {
        savedQuote = await Quote.create(finalQuoteToSave);
        window.history.replaceState({}, '', `${window.location.pathname}?id=${savedQuote.id}`);
      }
      
      setQuote(savedQuote);

      if (showMessage) {
        setMessage({ type: 'success', text: 'Quote saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      }

      await logAuditEvent({
          action: actionType,
          entityType: 'Quote',
          entityId: savedQuote.id,
          entityName: savedQuote.quote_number,
          newValues: finalQuoteToSave,
          actorId: permissionsCurrentUser?.id,
      });

      return savedQuote;
    } catch (error) {
      console.error('Error saving quote:', error);
      if (showMessage) {
        setMessage({ type: 'error', text: 'Failed to save quote. Please try again.' });
      }
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuoteStateUpdate = async (updatedQuoteData) => {
    if (!lookupData) return null;

    const oldQuote = quote;
    const isOverallApprovalDecision = 
        (updatedQuoteData.discount_status === 'approved' || updatedQuoteData.discount_status === 'rejected') &&
        oldQuote.discount_status === 'pending_approval';
    
    // If overall discount is being approved, mark existing items as eligible
    if (isOverallApprovalDecision && updatedQuoteData.discount_status === 'approved') {
      const currentItemIds = (updatedQuoteData.line_items || []).map(item => item.id);
      updatedQuoteData.line_items = (updatedQuoteData.line_items || []).map(item => ({
        ...item,
        eligible_for_overall_discount: true
      }));
      updatedQuoteData.overall_discount_applied_to_items = currentItemIds;
    }
    
    const lineItemApprovalDecisions = [];
    if (updatedQuoteData.line_items && oldQuote.line_items) {
        updatedQuoteData.line_items.forEach((newItem, index) => {
            const oldItem = oldQuote.line_items?.[index];
            if (oldItem && (newItem.line_discount_status === 'approved' || newItem.line_discount_status === 'rejected') &&
                oldItem.line_discount_status === 'pending_approval') {
                lineItemApprovalDecisions.push({ newItem, oldItem, index });
            }
        });
    }

    setQuote(updatedQuoteData); 
    const savedQuote = await handleSaveQuote(updatedQuoteData, false);

    if (savedQuote) {
        if (isOverallApprovalDecision) {
            const action = savedQuote.discount_status === 'approved' ? 'overall_discount_approved' : 'overall_discount_rejected';
            await logAuditEvent({
                action: action,
                entityType: 'Quote',
                entityId: savedQuote.id,
                entityName: savedQuote.quote_number,
                newValues: { discount_status: savedQuote.discount_status, notes: savedQuote.discount_approval_notes },
                actorId: permissionsCurrentUser?.id,
            });
        }
        
        lineItemApprovalDecisions.forEach(async ({ newItem, index }) => {
            const action = newItem.line_discount_status === 'approved' ? 'line_item_discount_approved' : 'line_item_discount_rejected';
            await logAuditEvent({
                action: action,
                entityType: 'QuoteLineItem',
                entityId: newItem.id,
                entityName: newItem.job_profile_title || `Line Item ${index+1}`,
                newValues: { line_discount_status: newItem.line_discount_status, notes: newItem.line_discount_approval_notes },
                parentId: savedQuote.id,
                parentType: 'Quote',
                actorId: permissionsCurrentUser?.id,
            });
        });
        
        return savedQuote;
    } else {
      setMessage({ type: 'error', text: 'Error: Could not save the approval decision. Please try again.' });
      return null;
    }
  };

  const handleCancelDiscountRequest = async (discountType, lineItemId) => {
    setIsProcessing(true);

    try {
        let quoteCopy = JSON.parse(JSON.stringify(quote));

        if (discountType === 'overall') {
          quoteCopy.overall_discount_percentage = 0;
          quoteCopy.discount_status = 'none';
          quoteCopy.discount_request_notes = '';
          quoteCopy.required_overall_approver_role_id = '';
          quoteCopy.discount_approver_id = '';
          quoteCopy.discount_decision_date = '';
          quoteCopy.discount_approval_notes = '';
          quoteCopy.overall_discount_applied_to_items = []; // Reset this on cancel

          await logAuditEvent({
              action: 'overall_discount_request_cancelled',
              entityType: 'Quote',
              entityId: quoteCopy.id,
              entityName: quoteCopy.quote_number,
              newValues: { discount_status: 'none' },
              actorId: permissionsCurrentUser?.id,
          });

        } else if (discountType === 'line_item' && lineItemId) {
          const lineItemIndex = quoteCopy.line_items.findIndex(item => item.id === lineItemId);
          if (lineItemIndex > -1) {
            const item = quoteCopy.line_items[lineItemIndex];
            item.manual_discount_percentage = 0;
            item.line_discount_status = 'none';
            item.line_discount_request_notes = '';
            item.required_approver_role_id = '';
            item.line_discount_approver_id = '';
            item.line_discount_decision_date = '';
            item.line_discount_approval_notes = '';
            item.eligible_for_overall_discount = false; // Reset this on cancel

            await logAuditEvent({
                action: 'line_item_discount_request_cancelled',
                entityType: 'QuoteLineItem',
                entityId: item.id,
                entityName: item.job_profile_title || `Line Item ${lineItemId}`,
                newValues: { line_discount_status: 'none' },
                parentId: quoteCopy.id,
                parentType: 'Quote',
                actorId: permissionsCurrentUser?.id,
            });
          }
        }

        setQuote(quoteCopy); 
        const saved = await handleSaveQuote(quoteCopy, false);

        if (saved) {
            setMessage({ type: 'success', text: 'Discount request withdrawn successfully.' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: 'Failed to withdraw discount request. Quote not saved.' });
        }
    } catch(error) {
        console.error("Error cancelling discount request:", error);
        setMessage({ type: 'error', text: 'Failed to withdraw discount request.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDiscountRequest = async (quoteWithRequest) => {
    setIsProcessing(true);
    setMessage(null);

    console.log('Starting discount request process...');

    const savedQuote = await handleQuoteStateUpdate(quoteWithRequest);

    if (!savedQuote) {
      setMessage({ type: 'error', text: 'Failed to save quote before requesting approval. Please check all fields.' });
      setIsProcessing(false);
      return;
    }

    console.log('Quote saved successfully:', savedQuote.id);

    const isOverallPending = savedQuote.discount_status === 'pending_approval';
    const pendingLineItem = savedQuote.line_items.find(item => item.line_discount_status === 'pending_approval');

    if (isOverallPending || pendingLineItem) {
      console.log('Sending discount request via ApprovalService...');
      
      const discountInfo = isOverallPending ? {
        type: 'overall',
        percentage: savedQuote.overall_discount_percentage,
        notes: savedQuote.discount_request_notes,
        roleId: savedQuote.required_overall_approver_role_id,
        entityId: savedQuote.id,
        entityType: 'Quote',
      } : {
        type: 'line_item',
        percentage: pendingLineItem.manual_discount_percentage,
        notes: pendingLineItem.line_discount_request_notes,
        roleId: pendingLineItem.required_approver_role_id,
        entityId: pendingLineItem.id,
        entityType: 'QuoteLineItem',
        parentId: savedQuote.id,
        parentType: 'Quote',
      };

      try {
          const approvalResult = await submitForApproval({
              entityType: discountInfo.entityType,
              entityId: discountInfo.entityId,
              requestorId: permissionsCurrentUser?.id,
              notes: discountInfo.notes,
              requiredRoleId: discountInfo.roleId,
              metadata: {
                  quoteId: savedQuote.id,
                  quoteNumber: savedQuote.quote_number,
                  discountType: discountInfo.type,
                  discountPercentage: discountInfo.percentage,
                  lineItemId: discountInfo.type === 'line_item' ? pendingLineItem.id : undefined,
                  lineItemTitle: discountInfo.type === 'line_item' ? pendingLineItem.job_profile_title : undefined,
              }
          });

          if (approvalResult && approvalResult.success) {
              console.log('Approval request submitted successfully');
              setMessage({ type: 'success', text: 'Discount request submitted and approvers notified!' });
              await logAuditEvent({
                  action: discountInfo.type === 'overall' ? 'overall_discount_request' : 'line_item_discount_request',
                  entityType: discountInfo.entityType,
                  entityId: discountInfo.entityId,
                  entityName: discountInfo.type === 'overall' ? savedQuote.quote_number : pendingLineItem.job_profile_title || `Line Item ${pendingLineItem.id}`,
                  newValues: { status: 'pending_approval', discount_percentage: discountInfo.percentage, notes: discountInfo.notes },
                  parentId: discountInfo.type === 'line_item' ? savedQuote.id : undefined,
                  parentType: discountInfo.type === 'line_item' ? 'Quote' : undefined,
                  actorId: permissionsCurrentUser?.id,
              });

          } else {
              console.log('Approval submission failed:', approvalResult?.reason);
              setMessage({ type: 'warning', text: `Request saved, but failed to submit for approval: ${approvalResult?.reason || 'Unknown error'}` });
          }
      } catch (e) {
          console.error("Error submitting for approval:", e);
          setMessage({ type: 'warning', text: `Request saved, but approval submission failed: ${e.message}` });
      }
    } else {
      console.log('Discount was self-approved');
      setMessage({ type: 'success', text: 'Discount applied successfully!' });
    }

    setIsProcessing(false);
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSendQuote = async () => {
    const finalQuoteState = updateOverallQuoteStatus(quote);
    
    if (finalQuoteState.status === 'pending_approval') {
      setMessage({
        type: 'error',
        text: 'Cannot send quote while there are pending discount approvals. Please wait for all discounts to be approved or rejected.'
      });
      return;
    }

    const savedQuote = await handleSaveQuote(finalQuoteState, true);
    if (savedQuote) {
      try {
        const sentQuote = await Quote.update(savedQuote.id, {
          ...savedQuote,
          status: 'sent',
          sent_date: new Date().toISOString().split('T')[0]
        });
        setQuote(sentQuote);

        setMessage({ type: 'success', text: 'Quote sent successfully!' });
        setTimeout(() => {
          navigate('/quotes');
        }, 2000);

        await logAuditEvent({
            action: 'send_quote',
            entityType: 'Quote',
            entityId: sentQuote.id,
            entityName: sentQuote.quote_number,
            newValues: { status: 'sent', sent_date: sentQuote.sent_date },
            actorId: permissionsCurrentUser?.id,
        });

      } catch (error) {
        console.error('Error sending quote:', error);
        setMessage({ type: 'error', text: 'Failed to send quote. Please try again.' });
      }
    }
  };

  const canSendQuote = () => {
    if (!quote || !quote.line_items || quote.line_items.length === 0) return false;
    const finalQuoteState = updateOverallQuoteStatus(quote);
    return finalQuoteState.status !== 'pending_approval';
  };

  const getDiscountStatusSummary = () => {
    if (!quote) return [];
    const pendingDiscounts = [];

    if (quote.discount_status === 'pending_approval') {
      pendingDiscounts.push('Overall Quote Discount');
    }

    const pendingLineDiscounts = quote.line_items?.filter(item =>
      item.line_discount_status === 'pending_approval'
    ).length || 0;

    if (pendingLineDiscounts > 0) {
      pendingDiscounts.push(`${pendingLineDiscounts} Line Item Discount${pendingLineDiscounts > 1 ? 's' : ''}`);
    }

    return pendingDiscounts;
  };

  const handleSave = async (actionType) => {
    setIsProcessing(true);
    setMessage(null);

    if (!quote) {
        setMessage({ type: 'error', text: 'No quote data to save.' });
        setIsProcessing(false);
        return;
    }

    try {
        if (actionType === 'draft') {
            const saved = await handleSaveQuote(quote, true);
            if (saved) {
                setMessage({ type: 'success', text: 'Quote saved as draft!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save quote as draft.' });
            }
        } else if (actionType === 'pending_overall_approval') {
            const currentOverallDiscount = quote?.overall_discount_percentage || 0;
            const userMaxOverallApproval = permissionsCurrentUser?.max_self_approve_overall_discount_percent || 0;
            const needsApprovalForOverallDiscount = currentOverallDiscount > 0 && currentOverallDiscount > userMaxOverallApproval;

            if (!needsApprovalForOverallDiscount) {
                setMessage({ type: 'warning', text: 'Discount is within self-approval limits. No approval request needed.' });
                setIsProcessing(false);
                return;
            }
            
            const quoteToRequestApproval = {
                ...quote,
                discount_status: 'pending_approval',
            };
            await handleDiscountRequest(quoteToRequestApproval); 
        } else if (actionType === 'send') {
            await handleSendQuote();
        }
    } catch (error) {
        console.error('Error during action:', error);
        setMessage({ type: 'error', text: 'An unexpected error occurred during the action.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const QuoteSummary = () => {
    if (!quote) return null;

    const {
      subtotal = 0,
      overall_discount_amount = 0,
      tax_amount = 0,
      total_amount = 0,
    } = quote;

    const subtotalAfterDiscount = subtotal - overall_discount_amount;

    return (
      <Card className="clay-card shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Quote Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Subtotal</span>
            <span className="font-medium text-gray-800">{formatCurrency(subtotal, currency)}</span>
          </div>

          {overall_discount_amount > 0 && (
            <div className="flex justify-between items-center text-red-600">
              <span className="flex items-center gap-2"><Tag className="w-4 h-4" /> Total Discount</span>
              <span className="font-medium">-{formatCurrency(overall_discount_amount, currency)}</span>
            </div>
          )}

          <div className="flex justify-between items-center border-t border-b py-2 my-2">
            <span className="text-gray-600">Subtotal After Discount</span>
            <span className="font-medium text-gray-800">{formatCurrency(subtotalAfterDiscount, currency)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600 flex items-center gap-2"><Percent className="w-4 h-4" /> VAT ({vatRate}%)</span>
            <span className="font-medium text-gray-800">{formatCurrency(tax_amount, currency)}</span>
          </div>

          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bold text-gray-800">Grand Total</span>
              <span className="font-bold text-emerald-700">{formatCurrency(total_amount, currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading || permissionsLoading || !lookupData) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
        <p className="text-center text-gray-500">Loading essential data...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-300" />
        <h2 className="text-xl font-semibold text-red-700 mb-2">Quote Not Found</h2>
        <p className="text-red-600">The requested quote could not be found.</p>
      </div>
    );
  }

  const pendingDiscounts = getDiscountStatusSummary();

  return (
    <div className="p-4 space-y-4 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4 sticky top-0 bg-white z-10 pt-4 pb-2 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {getQuoteId() ? `Edit Quote: ${quote.quote_number}` : 'Create New Quote'}
          </h1>
          <p className="text-sm text-gray-600">
            Build comprehensive quotes with automated pricing and discount approval workflow.
          </p>
        </div>
        <div className="flex gap-2">
            <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="clay-button"
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
            </Button>
          <Button
            onClick={() => setShowAttachmentsDialog(true)}
            variant="outline"
            className="clay-button"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Attachments
          </Button>
        </div>
      </div>

      {/* Warning for quotes without source */}
      {showMissingSourceWarning && (
        <Alert className="mb-6 bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Warning:</strong> This quote is not linked to a Lead or Opportunity, which may affect sales tracking and reporting. 
            Consider creating this quote from a <a href="/leads" className="underline font-medium">Lead</a> or 
            <a href="/opportunities" className="underline font-medium ml-1">Opportunity</a> instead.
          </AlertDescription>
        </Alert>
      )}

      {/* Messages */}
      {message && (
        <Alert className={`mb-6 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : message.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
            <AlertTitle className="font-medium flex items-center gap-2">
                {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4" />
                ) : (
                <AlertTriangle className="w-4 h-4" />
                )}
                {message.type === 'success' ? 'Success' : message.type === 'warning' ? 'Warning' : 'Error'}
            </AlertTitle>
          <AlertDescription>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Pending Discounts Alert */}
      {pendingDiscounts.length > 0 && (
        <Alert className="mb-6 bg-yellow-50 border-yellow-200">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Pending Approvals:</strong> {pendingDiscounts.join(', ')} require approval before the quote can be sent.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="clay-element sticky top-16 bg-white z-10">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quote Details
          </TabsTrigger>
          <TabsTrigger value="line-items" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Line Items
            {quote.line_items?.length > 0 && (
              <Badge className="ml-1 bg-blue-500 text-white text-xs">
                {quote.line_items.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Discounts & Approval
            {pendingDiscounts.length > 0 && (
              <Badge className="ml-1 bg-yellow-500 text-white text-xs">
                {pendingDiscounts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="clay-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {linkedSource && (
                <div className="space-y-2 mb-4 p-3 bg-gray-50 rounded-lg border">
                  <Label>Quote Source</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-base py-1 px-3">
                      {linkedSource.type === 'opportunity' ? (
                        <a href={`/opportunities/${linkedSource.data.id}`} className="flex items-center gap-2 font-medium text-blue-700 hover:underline">
                          <Target className="w-4 h-4" />
                          <span>Opportunity: {linkedSource.data.name}</span>
                        </a>
                      ) : (
                        <a href={`/leads/${linkedSource.data.id}`} className="flex items-center gap-2 font-medium text-green-700 hover:underline">
                          <Users className="w-4 h-4" />
                          <span>Lead: {linkedSource.data.company_name}</span>
                        </a>
                      )}
                    </Badge>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote-number">Quote Number</Label>
                  <Input
                    id="quote-number"
                    value={quote.quote_number}
                    onChange={(e) => handleQuoteFieldChange('quote_number', e.target.value)}
                    className="clay-element border-none"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-select">Select Lead</Label>
                  <Select
                    value={quote.lead_id || ""}
                    onValueChange={(value) => handleQuoteFieldChange('lead_id', value)}
                  >
                    <SelectTrigger id="lead-select" className="clay-element border-none">
                      <SelectValue placeholder="Choose a lead..." />
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-company">Client Company *</Label>
                  <Input
                    id="client-company"
                    value={quote.client_company}
                    onChange={(e) => handleQuoteFieldChange('client_company', e.target.value)}
                    className="clay-element border-none"
                  />
                </div>
                <div>
                  <Label htmlFor="client-contact">Client Contact *</Label>
                  <Input
                    id="client-contact"
                    value={quote.client_contact}
                    onChange={(e) => handleQuoteFieldChange('client_contact', e.target.value)}
                    className="clay-element border-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="effective-date">Effective Date</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={quote.effective_date}
                    onChange={(e) => handleQuoteFieldChange('effective_date', e.target.value)}
                    className="clay-element border-none"
                  />
                </div>
                <div>
                  <Label htmlFor="valid-until">Valid Until</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={quote.valid_until}
                    onChange={(e) => handleQuoteFieldChange('valid_until', e.target.value)}
                    className="clay-element border-none"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="terms-conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms-conditions"
                  value={quote.terms_conditions}
                  onChange={(e) => handleQuoteFieldChange('terms_conditions', e.target.value)}
                  className="clay-element border-none h-20"
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  value={quote.notes}
                  onChange={(e) => handleQuoteFieldChange('notes', e.target.value)}
                  placeholder="Internal notes (not visible to client)..."
                  className="clay-element border-none h-20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Line Items Tab with Quote Summary */}
        <TabsContent value="line-items" className="space-y-6">
          <QuoteLineItemBuilder
            quote={quote}
            onLineItemsChange={handleLineItemsChange}
            currency={currency}
            vatRate={vatRate}
            lookupData={lookupData}
            isLoading={!lookupData}
          />
          <QuoteSummary />
        </TabsContent>

        {/* Discounts Tab */}
        <TabsContent value="discounts" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Overall Quote Discount Section */}
            <DiscountApprovalSection
              quote={quote}
              discountType="overall"
              onDiscountUpdate={handleQuoteStateUpdate}
              onDiscountRequest={handleDiscountRequest}
              onCancelRequest={handleCancelDiscountRequest}
              currentUser={permissionsCurrentUser}
              currency={currency}
            />

            {/* Line Item Discount Sections */}
            {quote.line_items?.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Line Item Discounts
                </h3>
                {quote.line_items.map((lineItem, index) => (
                  <div key={lineItem.id || index} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                      onClick={() => toggleLineItemExpansion(lineItem.id)}
                    >
                      <div className="font-medium">
                        {lineItem.job_profile_title || `Line Item ${index + 1}`}
                        {lineItem.line_discount_status === 'pending_approval' && (
                          <Badge className="ml-2 bg-yellow-500">Pending Approval</Badge>
                        )}
                        {lineItem.line_discount_status === 'approved' && lineItem.manual_discount_percentage > 0 && (
                          <Badge className="ml-2 bg-green-500">Discount Applied ({lineItem.manual_discount_percentage}%)</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{formatCurrency(lineItem.line_grand_total || 0, currency)}</span>
                        {expandedLineItems[lineItem.id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {expandedLineItems[lineItem.id] && (
                      <div className="p-4 border-t">
                        <DiscountApprovalSection
                          quote={quote}
                          discountType="line_item"
                          lineItemId={lineItem.id}
                          onDiscountUpdate={handleQuoteStateUpdate}
                          onDiscountRequest={handleDiscountRequest}
                          onCancelRequest={handleCancelDiscountRequest}
                          currentUser={permissionsCurrentUser}
                          currency={currency}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions Card */}
      <Card className="clay-card mt-6">
          <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage quote lifecycle and approvals.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
               <Button 
                onClick={() => handleSave('draft')} 
                disabled={isSaving || isProcessing}
                className="clay-button"
               >
                  <Save className="w-4 h-4 mr-2" /> Save as Draft
              </Button>
              
              {/* FIXED: Only show Request Discount Approval if user CANNOT self-approve */}
              {(() => {
                const currentOverallDiscount = quote?.overall_discount_percentage || 0;
                const userMaxOverallApproval = permissionsCurrentUser?.max_self_approve_overall_discount_percent || 0;
                const needsApprovalForOverallDiscount = currentOverallDiscount > 0 && currentOverallDiscount > userMaxOverallApproval;
                
                return needsApprovalForOverallDiscount && quote?.discount_status !== 'pending_approval' && (
                  <Button 
                    onClick={() => handleSave('pending_overall_approval')} 
                    disabled={isSaving || isProcessing}
                    className="clay-button bg-orange-500 hover:bg-orange-600 text-white"
                  >
                      <Info className="w-4 h-4 mr-2" /> Request Discount Approval
                  </Button>
                );
              })()}
              
              <Button 
                onClick={() => handleSave('send')}
                disabled={isSaving || isProcessing || !canSendQuote()}
                className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200"
              >
                  <Mail className="w-4 h-4 mr-2" /> Send to Client
              </Button>
          </CardContent>
      </Card>

      {/* Attachments Dialog */}
      <Dialog open={showAttachmentsDialog} onOpenChange={setShowAttachmentsDialog}>
        <DialogContent className="sm:max-w-[600px] clay-card">
          <DialogHeader>
            <DialogTitle>Quote Attachments</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <QuoteAttachments
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
