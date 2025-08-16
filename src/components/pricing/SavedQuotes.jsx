
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Eye, Download, Trash2 } from "lucide-react";

// Mock data for demonstration
const savedQuotes = [
  {
    id: '1',
    name: 'Construction Workers - Dubai Project',
    jobTitle: 'Construction Worker',
    quantity: 25,
    totalCost: 87500,
    createdDate: '2024-01-15',
    status: 'draft'
  },
  {
    id: '2',
    name: 'Hospitality Staff - Hotel Chain',
    jobTitle: 'Hotel Staff',
    quantity: 15,
    totalCost: 45000,
    createdDate: '2024-01-10',
    status: 'sent'
  }
];

export default function SavedQuotes() {
  return (
    <Card className="clay-card border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          Recent Quotes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {savedQuotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No saved quotes yet</p>
            <p className="text-sm">Create and save quotes to see them here</p>
          </div>
        ) : (
          savedQuotes.map((quote) => (
            <div key={quote.id} className="p-4 clay-element hover:scale-102 transition-transform duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 mb-1">{quote.name}</h4>
                  <p className="text-sm text-gray-600">
                    {quote.quantity} × {quote.jobTitle}
                  </p>
                </div>
                <Badge 
                  className={`${quote.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} border-none rounded-xl`}
                >
                  {quote.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">${quote.totalCost.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{quote.createdDate}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/50 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
