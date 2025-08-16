
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Quote } from '@/api/entities';
import { Lead } from '@/api/entities';
import { FileText, Plus, Download, AlertTriangle, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { logAuditEvent } from '@/components/common/AuditService'; // Import the audit service

import QuoteList from '../components/quotes/QuoteList';
import QuoteToolbar from '../components/quotes/QuoteToolbar';
import QuoteStats from '../components/quotes/QuoteStats';
import { ProtectedButton } from '@/components/common/ProtectedComponent';

// Module-level cache for system settings
let settingsCache = null;

export default function QuotesPage() {
  const [quotes, setQuotes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeadsLoading, setIsLeadsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: 'all',
    client: 'all'
  });
  const [error, setError] = useState(null);
  const [showCreateQuoteGuidance, setShowCreateQuoteGuidance] = useState(false); // New state for modal

  const navigate = useNavigate();

  useEffect(() => {
    // Load quotes first (priority), then leads separately
    loadQuotes();
    loadLeads();
  }, []);

  const loadQuotes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading quotes...');
      const quotesData = await Quote.list('-created_date', 50); // Limit to 50 recent quotes
      console.log(`Loaded ${quotesData.length} quotes`);
      setQuotes(quotesData || []);
    } catch (error) {
      console.error("Error loading quotes:", error);
      setError('Failed to load quotes. Please refresh to try again.');
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeads = async () => {
    setIsLeadsLoading(true);
    
    try {
      console.log('Loading leads...');
      const leadsData = await Lead.list('-updated_date', 100); // Limit leads as well
      console.log(`Loaded ${leadsData.length} leads`);
      setLeads(leadsData || []);
    } catch (error) {
      console.error("Error loading leads:", error);
      // Don't show error for leads - quotes can work without detailed lead info
      setLeads([]);
    } finally {
      setIsLeadsLoading(false);
    }
  };

  const handleEdit = (quote) => {
    // Navigate to QuoteCreator with the quote ID for editing
    navigate(createPageUrl(`QuoteCreator?id=${quote.id}`));
  };

  const handleDelete = async (quoteId) => {
    if (window.confirm('Are you sure you want to delete this quote?')) {
      try {
        // Get quote details before deletion for audit log
        const quoteToDelete = quotes.find(q => q.id === quoteId);
        
        await Quote.delete(quoteId);
        
        // Log the deletion
        await logAuditEvent({
          action: 'delete',
          entityType: 'Quote',
          entityId: quoteId,
          entityName: quoteToDelete?.quote_number || `Quote ${quoteId}`,
          oldValues: quoteToDelete,
          newValues: {},
        });
        
        // Remove from local state instead of reloading everything
        setQuotes(prevQuotes => prevQuotes.filter(q => q.id !== quoteId));
      } catch (error) {
        console.error("Failed to delete quote:", error);
        alert("Failed to delete quote.");
      }
    }
  };

  const getQuoteStats = () => {
    const totalQuotes = quotes.length;
    const totalValue = quotes.reduce((sum, quote) => sum + (parseFloat(quote.total_amount) || 0), 0);
    const pendingQuotes = quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length;
    const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
    const acceptanceRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes * 100) : 0;

    return {
      totalQuotes,
      totalValue,
      pendingQuotes,
      acceptanceRate,
      acceptedQuotes
    };
  };

  const filteredQuotes = quotes.filter(quote => {
    if (filters.status !== 'all' && quote.status !== filters.status) return false;
    return true;
  });

  const stats = getQuoteStats();

  // Show error message if there's a critical error
  if (error && !isLoading) {
    return (
      <div className="p-4 space-y-3 min-h-screen">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Quote Management</h1>
            <p className="text-sm text-gray-600">Create, track, and manage all your client quotations.</p>
          </div>
        </div>

        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>

        <div className="flex justify-center py-8">
          <Button onClick={loadQuotes} className="clay-button bg-red-500 hover:bg-red-600 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quote Management</h1>
          <p className="text-sm text-gray-600">Create, track, and manage all your client quotations.</p>
        </div>
        <div className="flex gap-2">
          <ProtectedButton module="quotes" action="export">
            <Button 
              variant="outline"
              className="clay-button border-none hover:scale-105 transition-transform duration-200 px-3 py-1.5 h-auto text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </ProtectedButton>
          <ProtectedButton module="quotes" action="create">
            <Button 
              onClick={() => setShowCreateQuoteGuidance(true)} // Modified button action
              className="clay-button bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:scale-105 transition-transform duration-200 px-3 py-1.5 h-auto text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
          </ProtectedButton>
        </div>
      </div>

      <QuoteStats stats={stats} isLoading={isLoading} />

      <div className="clay-card p-2">
        <QuoteToolbar 
          filters={filters} 
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        
        {isLoading ? (
          <div className="p-2">
            {viewMode === 'table' ? (
              Array(8).fill(0).map((_, i) => (
                 <Skeleton key={i} className="h-10 w-full mb-1.5 rounded-lg" />
              ))
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array(8).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                ))}
              </div>
            )}
          </div>
        ) : (
          <QuoteList 
            quotes={filteredQuotes} 
            leads={leads}
            isLeadsLoading={isLeadsLoading}
            viewMode={viewMode}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Create Quote Guidance Modal */}
      <Dialog open={showCreateQuoteGuidance} onOpenChange={setShowCreateQuoteGuidance}>
        <DialogContent className="clay-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Create New Quote
            </DialogTitle>
            <DialogDescription>
              To maintain proper sales tracking, quotes must be linked to a Lead or Opportunity. Please choose how you'd like to proceed:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-3">
              <Link 
                to={createPageUrl("LeadsPipeline")} 
                onClick={() => setShowCreateQuoteGuidance(false)}
                className="flex items-center gap-3 p-4 clay-element hover:scale-102 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Start with a Lead</h3>
                  <p className="text-sm text-gray-600">Create or select a lead, then convert to opportunity and quote.</p>
                </div>
              </Link>

              <Link 
                to={createPageUrl("Opportunities")} 
                onClick={() => setShowCreateQuoteGuidance(false)}
                className="flex items-center gap-3 p-4 clay-element hover:scale-102 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Start with an Opportunity</h3>
                  <p className="text-sm text-gray-600">Create or select an opportunity, then create quote from it.</p>
                </div>
              </Link>

              <div className="border-t pt-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateQuoteGuidance(false);
                    // Navigate to QuoteCreator but with a warning
                    navigate(createPageUrl("QuoteCreator") + "?warning=missing_source");
                  }}
                  className="w-full clay-element"
                >
                  Create Quote Without Lead/Opportunity
                  <span className="text-xs text-orange-600 ml-2">(Not Recommended)</span>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
