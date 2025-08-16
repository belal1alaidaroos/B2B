import React, { useState, useEffect } from 'react';
import { CustomerInteraction } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Filter,
  Star,
  MessageCircle,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

import CreateInteractionModal from '../components/customer/CreateInteractionModal';
import InteractionDetailModal from '../components/customer/InteractionDetailModal';

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800', 
  waiting_customer: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  escalated: 'bg-red-100 text-red-800'
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const statusIcons = {
  open: <Clock className="w-4 h-4" />,
  in_progress: <ArrowRight className="w-4 h-4" />,
  waiting_customer: <MessageCircle className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  closed: <CheckCircle className="w-4 h-4" />,
  escalated: <AlertCircle className="w-4 h-4" />
};

export default function CustomerInteractionsPage() {
  const [interactions, setInteractions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      if (user.user_type === 'customer') {
        const userInteractions = await CustomerInteraction.filter({ 
          customer_user_id: user.id 
        }, '-created_date');
        setInteractions(userInteractions);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInteractionCreated = () => {
    setShowCreateModal(false);
    loadData();
  };

  const handleInteractionUpdated = () => {
    setSelectedInteraction(null);
    loadData();
  };

  const filteredInteractions = interactions.filter(interaction => {
    const matchesSearch = interaction.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         interaction.messages?.some(msg => msg.content?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || interaction.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || interaction.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getLastMessagePreview = (interaction) => {
    if (!interaction.messages || interaction.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = interaction.messages[interaction.messages.length - 1];
    const preview = lastMessage.content.length > 100 
      ? lastMessage.content.substring(0, 100) + '...'
      : lastMessage.content;
    return `${lastMessage.sender_type === 'customer' ? 'You' : lastMessage.sender_name}: ${preview}`;
  };

  const getStats = () => {
    return {
      total: interactions.length,
      open: interactions.filter(i => i.status === 'open').length,
      inProgress: interactions.filter(i => i.status === 'in_progress').length,
      resolved: interactions.filter(i => ['resolved', 'closed'].includes(i.status)).length
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {currentUser?.first_name}!
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Manage all your communications with our team in one place. Start a new conversation or continue an existing one.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Conversations</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <ArrowRight className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Start New Conversation
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting_customer">Waiting</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Interactions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                        <div className="h-5 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInteractions.length > 0 ? (
          filteredInteractions.map((interaction) => (
            <Card 
              key={interaction.id} 
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200 hover:border-blue-300"
              onClick={() => setSelectedInteraction(interaction)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {interaction.subject}
                      </h3>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={statusColors[interaction.status]}>
                          {statusIcons[interaction.status]}
                          <span className="ml-1 capitalize">
                            {interaction.status.replace('_', ' ')}
                          </span>
                        </Badge>
                        <Badge className={priorityColors[interaction.priority]}>
                          {interaction.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed">
                      {getLastMessagePreview(interaction)}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{interaction.messages?.length || 0} messages</span>
                        </div>
                        {interaction.assigned_to_employee_name && (
                          <div className="flex items-center gap-1">
                            <span>Assigned to:</span>
                            <span className="font-medium text-blue-600">
                              {interaction.assigned_to_employee_name}
                            </span>
                          </div>
                        )}
                        {interaction.customer_rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span>{interaction.customer_rating}/5</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {format(new Date(interaction.created_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No conversations found
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : "You haven't started any conversations yet."
                }
              </p>
              {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start Your First Conversation
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateInteractionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleInteractionCreated}
          currentUser={currentUser}
        />
      )}

      {selectedInteraction && (
        <InteractionDetailModal
          isOpen={!!selectedInteraction}
          onClose={() => setSelectedInteraction(null)}
          interaction={selectedInteraction}
          currentUser={currentUser}
          onUpdate={handleInteractionUpdated}
        />
      )}
    </div>
  );
}