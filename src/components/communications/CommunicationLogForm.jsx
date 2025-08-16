
import React, { useState, useEffect } from 'react';
import { Communication } from '@/api/entities';
import { SendEmail } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, XCircle, Send, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CommunicationLogForm({ leads, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    lead_id: '',
    type: 'email',
    direction: 'outbound',
    subject: '',
    content: '',
    status: 'sent',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null); // Clear any previous errors

    try {
      const { type, lead_id, subject, content } = formData;
      const selectedLead = leads.find(l => l.id === lead_id);
      
      if (!selectedLead) {
        setError("Please select an associated lead."); // Use in-component Alert for validation
        setIsSaving(false);
        return; // Exit early if validation fails
      }

      let newCommunication; // Declare newCommunication here

      // If communication type is email, send it first
      if (type === 'email') {
        if (!subject) {
          setError("Subject is required for emails."); // Use in-component Alert for validation
          setIsSaving(false);
          return; // Exit early if validation fails
        }
        
        await SendEmail({
          to: selectedLead.email,
          subject: subject,
          body: content
        });
        
        // Update status for logging on the formData object before saving
        formData.status = 'sent'; 
      }

      // Log the communication in the system and capture the created object
      newCommunication = await Communication.create(formData);
      
      // Pass the new communication data to the parent component for audit logging
      onSuccess(newCommunication); 

    } catch (error) { // Catch any errors from SendEmail or Communication.create
      console.error("Failed to create communication:", error);
      alert("Failed to save communication. Please try again."); // Use browser alert for general submission errors
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="clay-card border-none mb-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          {formData.type === 'email' ? 'Compose Email' : 'Log Communication'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label htmlFor="lead-select">Associated Lead *</Label>
              <Select value={formData.lead_id} onValueChange={(value) => handleChange('lead_id', value)} required>
                <SelectTrigger id="lead-select"><SelectValue placeholder="Select a lead..." /></SelectTrigger>
                <SelectContent>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name} ({lead.contact_person})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="type-select">Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                <SelectTrigger id="type-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="note">Internal Note</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="direction-select">Direction</Label>
              <Select value={formData.direction} onValueChange={(value) => handleChange('direction', value)}>
                <SelectTrigger id="direction-select"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {formData.type === 'email' && (
            <div className="space-y-1">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" value={formData.subject} onChange={(e) => handleChange('subject', e.target.value)} required />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="content">Content / Notes</Label>
            <Textarea id="content" value={formData.content} onChange={(e) => handleChange('content', e.target.value)} rows={5} placeholder={formData.type === 'email' ? 'Compose your email here...' : 'Log notes about the phone call, meeting, etc.'} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                formData.type === 'email' ? <><Send className="w-4 h-4 mr-2" /> Send & Log</> : <><Save className="w-4 h-4 mr-2" /> Save Log</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
