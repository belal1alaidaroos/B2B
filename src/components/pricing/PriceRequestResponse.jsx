import React, { useState, useEffect } from 'react';
import { PriceRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, UserCheck, MessageSquare, Check, X } from 'lucide-react';
import ProtectedComponent from '@/components/common/ProtectedComponent';

export default function PriceRequestResponse({ request, lead, financeTeam, onSuccess, jobProfiles }) {
  const [response, setResponse] = useState({
    assigned_to_finance: request.assigned_to_finance || '',
    approved_price: request.finance_response?.approved_price || '',
    notes_from_finance: request.finance_response?.notes_from_finance || '',
    status: request.status,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  useEffect(() => {
    User.me().then(setCurrentUser).catch(console.error);
  }, []);

  const handleChange = (field, value) => {
    setResponse(prev => ({ ...prev, [field]: value }));
  };

  const sendResponseNotificationEmail = async (salesUserEmail, decision, approvedPrice, notes) => {
    try {
      const subject = `📋 Price Request Update - ${lead.company_name}`;
      const statusEmoji = decision === 'approved' ? '✅' : decision === 'rejected' ? '❌' : '🔄';
      const statusText = decision === 'approved' ? 'APPROVED' : decision === 'rejected' ? 'REJECTED' : 'UPDATED';

      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">${statusEmoji} Price Request ${statusText}</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details</h3>
            <p><strong>Lead Company:</strong> ${lead.company_name}</p>
            <p><strong>Request Status:</strong> <span style="color: ${decision === 'approved' ? '#16a34a' : decision === 'rejected' ? '#dc2626' : '#2563eb'}; font-weight: bold;">${statusText}</span></p>
            ${approvedPrice ? `<p><strong>💰 Approved Price:</strong> ${approvedPrice} per unit/month</p>` : ''}
            <p><strong>Responded by:</strong> ${currentUser.full_name} (${currentUser.email})</p>
          </div>

          ${notes ? `
            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #059669;">💬 Response from Finance Team:</h4>
              <p style="margin: 0;">${notes}</p>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
            <p><strong>Next Steps:</strong></p>
            ${decision === 'approved' ? 
              '<p>✅ You can now proceed with this pricing for your client.</p>' :
              decision === 'rejected' ? 
              '<p>❌ Please review the feedback and consider alternative approaches.</p>' :
              '<p>🔄 Please check the updated information and proceed accordingly.</p>'
            }
          </div>

          <p style="margin-top: 30px;">You can view the full details by logging into the CRM system.</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">This is an automated notification from StaffCRM Price Request system.</p>
        </div>
      `;

      await SendEmail({
        to: salesUserEmail,
        subject: subject,
        body: body,
        from_name: 'StaffCRM Finance Team'
      });

      console.log(`✅ Response notification email sent to ${salesUserEmail}`);
    } catch (emailError) {
      console.error("Failed to send response notification email:", emailError);
      // Don't throw error - notification failure shouldn't stop the process
    }
  };

  const handleSubmit = async (newStatus) => {
    if (!currentUser) {
      setError("Cannot submit response without user context.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const updateData = {
        status: newStatus,
        assigned_to_finance: response.assigned_to_finance || null,
        finance_response: {
            approved_price: Number(response.approved_price) || null,
            notes_from_finance: response.notes_from_finance,
            response_date: new Date().toISOString(),
            responded_by: currentUser.email,
        }
    };
    
    try {
        await PriceRequest.update(request.id, updateData);
        
        // Send notification to the sales person who made the request
        if (request.requested_by) {
          await sendResponseNotificationEmail(
            request.requested_by, 
            newStatus, 
            response.approved_price, 
            response.notes_from_finance
          );
        }
        
        onSuccess();
    } catch(err) {
        console.error("Failed to update price request:", err);
        setError("An error occurred while submitting the response.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const details = request.request_details;
  const jobProfile = jobProfiles?.find(jp => jp.id === details?.job_profile_id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Request Details */}
        <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-xl clay-element">
                <h4 className="font-semibold text-gray-800 mb-2">Request Summary</h4>
                <p className="text-sm"><strong>Lead:</strong> {lead?.company_name}</p>
                <p className="text-sm"><strong>Job Title:</strong> {jobProfile?.job_title || details?.job_profile_id}</p>
                <p className="text-sm"><strong>Quantity:</strong> {details?.quantity}</p>
                <p className="text-sm"><strong>Nationality:</strong> {details?.nationality}</p>
                <p className="text-sm"><strong>Location:</strong> {details?.location}</p>
                <p className="text-sm"><strong>Duration:</strong> {details?.contract_duration} months</p>
                {request.due_date && <p className="text-sm"><strong>Response Due:</strong> {new Date(request.due_date).toLocaleDateString()}</p>}
            </div>

            <div className="p-4 rounded-xl clay-element">
                <h4 className="font-semibold text-gray-800 mb-2">Notes from Sales</h4>
                <p className="text-sm text-gray-600 italic">
                    {details?.notes_from_sales || "No notes provided."}
                </p>
            </div>
        </div>

        {/* Right Side: Finance Response Form */}
        <div className="lg:col-span-2 space-y-4">
          <ProtectedComponent module="price_requests" action="respond">
            {error && (
              <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            )}

            <div>
                <Label htmlFor="assigned_to_finance" className="flex items-center gap-2 mb-1"><UserCheck className="w-4 h-4" /> Reassign To (Optional)</Label>
                <Select
                  value={response.assigned_to_finance}
                  onValueChange={(value) => handleChange('assigned_to_finance', value)}
                >
                  <SelectTrigger id="assigned_to_finance" className="clay-element border-none">
                    <SelectValue placeholder="Keep current assignment" />
                  </SelectTrigger>
                  <SelectContent className="clay-card">
                    {financeTeam.map(user => (
                      <SelectItem key={user.id} value={user.email}>{user.full_name} ({user.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to keep current assignment
                </p>
            </div>

            <div>
                <Label htmlFor="approved_price" className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4" /> Approved Price (per unit / month)</Label>
                <Input
                  id="approved_price"
                  type="number"
                  value={response.approved_price}
                  onChange={(e) => handleChange('approved_price', e.target.value)}
                  className="clay-element border-none"
                  placeholder="e.g., 2500"
                />
            </div>
            
            <div>
                <Label htmlFor="notes_from_finance" className="flex items-center gap-2 mb-1"><MessageSquare className="w-4 h-4" /> Notes for Sales Team</Label>
                <Textarea
                  id="notes_from_finance"
                  value={response.notes_from_finance}
                  onChange={(e) => handleChange('notes_from_finance', e.target.value)}
                  className="clay-element border-none h-28"
                  placeholder="Explain reasoning, specify conditions, or provide alternative suggestions."
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/50">
                <Button
                    onClick={() => handleSubmit('rejected')}
                    disabled={isSubmitting}
                    variant="outline"
                    className="clay-button bg-gradient-to-r from-red-50 to-red-100 text-red-700"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="w-4 h-4 mr-2" />}
                    Reject Request
                </Button>
                <Button
                    onClick={() => handleSubmit('approved')}
                    disabled={isSubmitting}
                    className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="w-4 h-4 mr-2" />}
                    Approve Request
                </Button>
            </div>
          </ProtectedComponent>
        </div>
    </div>
  );
}