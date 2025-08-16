import React, { useState, useEffect } from 'react';
import { PriceRequest } from '@/api/entities';
import { User } from '@/api/entities';
import { Role } from '@/api/entities';
import { SendEmail } from '@/api/integrations';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck } from 'lucide-react';

export default function PriceRequestForm({ lead, jobProfile, parameters, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    priority: 'medium',
    notes_from_sales: '',
    due_date: '',
    assigned_to_finance: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [financeUsers, setFinanceUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [user, users, roles] = await Promise.all([
          User.me(),
          User.list(),
          Role.list()
        ]);
        
        setCurrentUser(user);

        // Find finance users
        const financeRole = roles.find(r => r.name === 'finance');
        if (financeRole) {
          const financeTeam = users.filter(u => u.roles?.includes(financeRole.id));
          setFinanceUsers(financeTeam);
        }
      } catch (e) {
        console.error("Could not fetch data:", e);
        setError("Could not load required data. Please ensure you are logged in.");
      }
    };
    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sendNotificationEmail = async (assignedUser, priceRequest) => {
    try {
      const subject = `🔔 New Price Request Assignment - ${lead.company_name}`;
      const body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">New Price Request Assigned to You</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Request Details</h3>
            <p><strong>Request ID:</strong> ${priceRequest.id}</p>
            <p><strong>Lead Company:</strong> ${lead.company_name}</p>
            <p><strong>Job Title:</strong> ${jobProfile.job_title}</p>
            <p><strong>Quantity:</strong> ${parameters.quantity}</p>
            <p><strong>Nationality:</strong> ${parameters.nationality}</p>
            <p><strong>Location:</strong> ${parameters.location}</p>
            <p><strong>Contract Duration:</strong> ${parameters.contractDuration} months</p>
            <p><strong>Priority:</strong> ${formData.priority.toUpperCase()}</p>
            <p><strong>Requested by:</strong> ${currentUser.full_name} (${currentUser.email})</p>
          </div>

          ${formData.notes_from_sales ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0;">Notes from Sales Team:</h4>
              <p style="margin: 0;">${formData.notes_from_sales}</p>
            </div>
          ` : ''}

          ${formData.due_date ? `
            <p style="color: #dc2626;"><strong>⏰ Response Due:</strong> ${new Date(formData.due_date).toLocaleDateString()}</p>
          ` : ''}

          <p style="margin-top: 30px;">Please log into the CRM system to review and respond to this request.</p>
          
          <hr style="margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280;">This is an automated notification from StaffCRM Price Request system.</p>
        </div>
      `;

      await SendEmail({
        to: assignedUser.email,
        subject: subject,
        body: body,
        from_name: 'StaffCRM Price Requests'
      });

      console.log(`✅ Notification email sent to ${assignedUser.email}`);
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
      // Don't throw error - notification failure shouldn't stop the process
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError("User not loaded. Cannot submit request.");
      return;
    }

    if (!formData.assigned_to_finance) {
      setError("Please select a finance team member to assign this request to.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const priceRequestData = {
      requested_by: currentUser.email,
      lead_id: lead.id,
      request_details: {
        job_profile_id: jobProfile.id,
        quantity: parameters.quantity,
        nationality: parameters.nationality,
        location: parameters.location,
        contract_duration: parameters.contractDuration,
        notes_from_sales: formData.notes_from_sales,
      },
      status: 'pending',
      priority: formData.priority,
      assigned_to_finance: formData.assigned_to_finance,
      due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null,
    };

    try {
      console.log("Creating price request with data:", priceRequestData);
      const newRequest = await PriceRequest.create(priceRequestData);
      console.log("Price request created successfully:", newRequest);
      
      // Send notification to assigned finance user
      const assignedUser = financeUsers.find(u => u.email === formData.assigned_to_finance);
      if (assignedUser) {
        await sendNotificationEmail(assignedUser, newRequest);
      }
      
      onSuccess(newRequest);

    } catch (err) {
      console.error("Failed to create price request:", err);
      setError("An error occurred while submitting the request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="p-4 rounded-xl clay-element">
        <h3 className="font-semibold mb-2">Request Summary</h3>
        <p className="text-sm"><strong>Lead:</strong> {lead.company_name}</p>
        <p className="text-sm"><strong>Job:</strong> {jobProfile.job_title}</p>
        <p className="text-sm"><strong>Quantity:</strong> {parameters.quantity}</p>
        <p className="text-sm"><strong>Nationality:</strong> {parameters.nationality}</p>
        <p className="text-sm"><strong>Location:</strong> {parameters.location}</p>
        <p className="text-sm"><strong>Contract Duration:</strong> {parameters.contractDuration} months</p>
      </div>

      <div>
        <Label htmlFor="assigned_to_finance" className="flex items-center gap-2 mb-1">
          <UserCheck className="w-4 h-4" /> Assign to Finance Team Member *
        </Label>
        <Select 
          value={formData.assigned_to_finance} 
          onValueChange={(value) => handleChange('assigned_to_finance', value)}
          required
        >
          <SelectTrigger id="assigned_to_finance" className="clay-element border-none">
            <SelectValue placeholder="Select a finance team member..." />
          </SelectTrigger>
          <SelectContent className="clay-card">
            {financeUsers.map(user => (
              <SelectItem key={user.email} value={user.email}>
                {user.full_name} ({user.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Choose the specific finance team member who should handle this request
        </p>
      </div>
      
      <div>
        <Label htmlFor="priority">Priority</Label>
        <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
          <SelectTrigger id="priority" className="clay-element border-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="clay-card">
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="due_date">Response Due Date</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => handleChange('due_date', e.target.value)}
          className="clay-element border-none"
        />
      </div>

      <div>
        <Label htmlFor="notes_from_sales">Notes for Finance Team</Label>
        <Textarea
          id="notes_from_sales"
          value={formData.notes_from_sales}
          onChange={(e) => handleChange('notes_from_sales', e.target.value)}
          placeholder="Explain why a special price is needed, provide competitor pricing, or other relevant details."
          className="clay-element border-none h-24"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || !currentUser || financeUsers.length === 0}
          className="clay-button bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        >
          {isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            'Submit Request'
          )}
        </Button>
      </div>
    </form>
  );
}