
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Percent, 
  DollarSign, 
  AlertCircle, 
  Check, 
  X, 
  Clock,
  Send,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { Role } from '@/api/entities';

export default function DiscountApprovalSection({ 
  quote, 
  discountType = 'overall', // 'overall' or 'line_item'
  lineItemId = null,
  onDiscountUpdate,
  onDiscountRequest,
  onCancelRequest,
  currentUser,
  currency = 'AED'
}) {
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get the specific line item if this is for line item discount
  const lineItem = discountType === 'line_item' && lineItemId 
    ? quote?.line_items?.find(item => item.id === lineItemId)
    : null;

  // Determine current discount data based on type
  const isOverall = discountType === 'overall';
  const currentDiscountPercent = isOverall 
    ? (quote?.overall_discount_percentage || 0)
    : (lineItem?.manual_discount_percentage || 0);
  const currentDiscountStatus = isOverall 
    ? (quote?.discount_status || 'none')
    : (lineItem?.line_discount_status || 'none');
  const currentDiscountNotes = isOverall 
    ? (quote?.discount_request_notes || '')
    : (lineItem?.line_discount_request_notes || '');

  React.useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const rolesData = await Role.list();
      setRoles(rolesData || []);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const [discountForm, setDiscountForm] = useState({
    percentage: currentDiscountPercent,
    notes: currentDiscountNotes,
    approverRoleId: ''
  });

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return `0.00 ${currency}`;
    return `${new Intl.NumberFormat('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    }).format(value)} ${currency}`;
  };

  const calculateDiscountAmount = () => {
    if (!quote || discountForm.percentage <= 0) return 0;
    
    if (isOverall) {
      return (quote.subtotal || 0) * (discountForm.percentage / 100);
    } else if (lineItem) {
      return (lineItem.subtotal_before_discount || 0) * (discountForm.percentage / 100);
    }
    return 0;
  };

  const canUserSelfApprove = () => {
    if (!currentUser) return false;
    
    const maxSelfApprove = isOverall 
      ? (currentUser.max_self_approve_overall_discount_percent || 0)
      : (currentUser.max_self_approve_line_discount_percent || 0);
    
    return discountForm.percentage <= maxSelfApprove;
  };

  // NEW: Check if user needs approval for current discount percentage
  const needsApproval = () => {
    if (!currentUser || discountForm.percentage <= 0) return false;
    return !canUserSelfApprove();
  };

  const handleApplyDiscount = async () => {
    if (discountForm.percentage <= 0) {
      alert('Please enter a valid discount percentage');
      return;
    }

    setIsLoading(true);
    
    try {
      const isSelfApproved = canUserSelfApprove();
      const finalStatus = isSelfApproved ? 'approved' : 'pending_approval';
      
      let updatedQuote = { ...quote };

      if (isOverall) {
        // For overall discount: mark existing items as eligible for the discount
        const currentItemIds = (updatedQuote.line_items || []).map(item => item.id);
        const updatedLineItems = (updatedQuote.line_items || []).map(item => ({
          ...item,
          // Only mark items as eligible if the overall discount is being approved (not just requested)
          eligible_for_overall_discount: isSelfApproved ? true : item.eligible_for_overall_discount
        }));

        updatedQuote = {
          ...updatedQuote,
          overall_discount_percentage: discountForm.percentage,
          discount_status: finalStatus,
          discount_request_notes: discountForm.notes,
          required_overall_approver_role_id: isSelfApproved ? '' : discountForm.approverRoleId,
          overall_discount_applied_to_items: isSelfApproved ? currentItemIds : (updatedQuote.overall_discount_applied_to_items || []),
          line_items: updatedLineItems
        };
      } else if (lineItem) {
        const updatedLineItems = updatedQuote.line_items.map(item => 
          item.id === lineItemId 
            ? {
                ...item,
                manual_discount_percentage: discountForm.percentage,
                line_discount_status: finalStatus,
                line_discount_request_notes: discountForm.notes,
                required_approver_role_id: isSelfApproved ? '' : discountForm.approverRoleId,
              }
            : item
        );
        updatedQuote.line_items = updatedLineItems;
      }

      if (isSelfApproved) {
        // Self-approved discount
        await onDiscountUpdate(updatedQuote);
      } else {
        // Requires approval
        await onDiscountRequest(updatedQuote);
      }

      // Reset form
      setDiscountForm({
        percentage: 0,
        notes: '',
        approverRoleId: ''
      });

    } catch (error) {
      console.error('Error applying discount:', error);
      alert('Failed to apply discount. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelDiscountRequest = async () => {
    if (window.confirm('Are you sure you want to cancel this discount request?')) {
      await onCancelRequest(discountType, lineItemId);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'none': { color: 'bg-gray-100 text-gray-800', label: 'No Discount' },
      'pending_approval': { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Approved' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const badge = badges[status] || badges.none;
    return <Badge className={badge.color}>{badge.label}</Badge>;
  };

  const renderCurrentDiscountInfo = () => {
    if (currentDiscountPercent <= 0) return null;

    return (
      <Alert className="mb-4 bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Current Discount Applied</AlertTitle>
        <AlertDescription className="text-blue-700">
          <div className="mt-2">
            <p><strong>Discount:</strong> {currentDiscountPercent}% ({formatCurrency(calculateDiscountAmount())})</p>
            <p><strong>Status:</strong> {getStatusBadge(currentDiscountStatus)}</p>
            {currentDiscountNotes && (
              <p><strong>Notes:</strong> {currentDiscountNotes}</p>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const isDiscountLocked = currentDiscountStatus === 'pending_approval';

  return (
    <Card className="clay-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="w-5 h-5 text-emerald-600" />
          {isOverall ? 'Overall Quote Discount' : `Line Item Discount: ${lineItem?.job_profile_title || 'Unknown Item'}`}
          {isDiscountLocked && (
            <Lock className="w-4 h-4 text-yellow-600" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderCurrentDiscountInfo()}

        {isDiscountLocked ? (
          <Alert className="bg-yellow-50 border-yellow-200">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">Approval Pending</AlertTitle>
            <AlertDescription className="text-yellow-700">
              This discount is currently pending approval and cannot be modified.
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancelDiscountRequest}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel Request
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-percentage">Discount Percentage (%)</Label>
                <div className="relative">
                  <Input
                    id="discount-percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={discountForm.percentage}
                    onChange={(e) => setDiscountForm(prev => ({ ...prev, percentage: parseFloat(e.target.value) || 0 }))}
                    className="clay-element pr-8"
                    placeholder="Enter discount %"
                  />
                  <Percent className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="discount-amount">Discount Amount</Label>
                <div className="relative">
                  <Input
                    id="discount-amount"
                    type="text"
                    value={formatCurrency(calculateDiscountAmount())}
                    readOnly
                    className="clay-element bg-gray-50 pr-8"
                  />
                  <DollarSign className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="discount-notes">Justification Notes</Label>
              <Textarea
                id="discount-notes"
                value={discountForm.notes}
                onChange={(e) => setDiscountForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Please provide justification for this discount..."
                className="clay-element h-20"
              />
            </div>

            {needsApproval() && (
              <div>
                <Label htmlFor="approver-role">Required Approver Role</Label>
                <Select 
                  value={discountForm.approverRoleId} 
                  onValueChange={(value) => setDiscountForm(prev => ({ ...prev, approverRoleId: value }))}
                >
                  <SelectTrigger className="clay-element">
                    <SelectValue placeholder="Select approver role..." />
                  </SelectTrigger>
                  <SelectContent className="clay-card">
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.display_name || role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {discountForm.percentage > 0 && (
              <Alert className={canUserSelfApprove() ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
                <AlertCircle className={`h-4 w-4 ${canUserSelfApprove() ? 'text-green-600' : 'text-orange-600'}`} />
                <AlertDescription className={canUserSelfApprove() ? 'text-green-700' : 'text-orange-700'}>
                  {canUserSelfApprove() 
                    ? `✅ You can self-approve this ${discountForm.percentage}% discount. It will be applied immediately.`
                    : `⚠️ This ${discountForm.percentage}% discount requires approval. A request will be sent to the selected role.`
                  }
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDiscountForm({ percentage: 0, notes: '', approverRoleId: '' })}
                disabled={isLoading}
              >
                Clear
              </Button>
              <Button 
                onClick={handleApplyDiscount}
                disabled={isLoading || discountForm.percentage <= 0 || (needsApproval() && !discountForm.approverRoleId)}
                className="clay-button bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : canUserSelfApprove() ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Apply Discount
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Request Approval
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
