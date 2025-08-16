import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '@/api/entities';
import { Lead } from '@/api/entities';
import { Opportunity } from '@/api/entities';
import { Account } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Plus, CheckCircle, AlertTriangle, Users, Target, Building } from 'lucide-react';
import { format, isPast, isToday, isTomorrow, isThisWeek } from 'date-fns';

import TaskForm from '../components/tasks/TaskForm';
import TaskCard from '../components/tasks/TaskCard';
import TaskToolbar from '../components/tasks/TaskToolbar';
import TaskStats from '../components/tasks/TaskStats';
import { usePermissions } from '@/components/hooks/usePermissions';
import ProtectedComponent from '@/components/common/ProtectedComponent';

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    dueDate: 'all',
    taskType: 'all'
  });
  
  const { canRead, canCreate, canUpdate, canDelete, currentUser, isSuperAdmin } = usePermissions();

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let query = {};
      if (!isSuperAdmin()) {
        // Regular users see only their assigned tasks or tasks they created
        query = {
          '$or': [
            { assigned_to: currentUser.id },
            { created_by: currentUser.email }
          ]
        };
      }

      const [tasksData, leadsData, oppsData, accountsData, usersData] = await Promise.all([
        Task.filter(query, '-due_date'),
        Lead.list(),
        Opportunity.list(),
        Account.list(),
        User.list()
      ]);

      setTasks(tasksData || []);
      setLeads(leadsData || []);
      setOpportunities(oppsData || []);
      setAccounts(accountsData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading tasks data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced filtering logic
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const searchTermLower = filters.searchTerm.toLowerCase();
      const matchesSearch = filters.searchTerm === '' ||
        task.title?.toLowerCase().includes(searchTermLower) ||
        task.description?.toLowerCase().includes(searchTermLower);

      const matchesStatus = filters.status === 'all' || task.status === filters.status;
      const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
      const matchesAssignee = filters.assignee === 'all' || 
        (filters.assignee === 'me' && task.assigned_to === currentUser?.id) ||
        task.assigned_to === filters.assignee;
      const matchesTaskType = filters.taskType === 'all' || task.task_type === filters.taskType;

      // Due date filtering
      let matchesDueDate = true;
      if (filters.dueDate !== 'all') {
        const dueDate = new Date(task.due_date);
        switch (filters.dueDate) {
          case 'overdue':
            matchesDueDate = isPast(dueDate) && !isToday(dueDate);
            break;
          case 'today':
            matchesDueDate = isToday(dueDate);
            break;
          case 'tomorrow':
            matchesDueDate = isTomorrow(dueDate);
            break;
          case 'this_week':
            matchesDueDate = isThisWeek(dueDate);
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesTaskType && matchesDueDate;
    });

    // Tab-based filtering
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => {
        switch (activeTab) {
          case 'pending':
            return task.status === 'pending';
          case 'in_progress':
            return task.status === 'in_progress';
          case 'completed':
            return task.status === 'completed';
          case 'overdue':
            return isPast(new Date(task.due_date)) && task.status !== 'completed';
          case 'my_tasks':
            return task.assigned_to === currentUser?.id;
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [tasks, filters, activeTab, currentUser]);

  const handleFormSave = async (taskData) => {
    try {
      if (selectedTask) {
        await Task.update(selectedTask.id, taskData);
      } else {
        const newTaskData = { ...taskData };
        if (!newTaskData.assigned_to && currentUser) {
          newTaskData.assigned_to = currentUser.id;
        }
        const newTask = await Task.create(newTaskData);
        // Generate task number
        const taskNumber = `T-${newTask.id.slice(-6).toUpperCase()}`;
        await Task.update(newTask.id, { task_number: taskNumber });
      }
      setIsFormOpen(false);
      setSelectedTask(null);
      loadData();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString();
        updateData.progress_percentage = 100;
      }
      await Task.update(taskId, updateData);
      loadData();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const overdue = tasks.filter(t => isPast(new Date(t.due_date)) && t.status !== 'completed').length;
    
    return { total, completed, pending, inProgress, overdue };
  };

  if (!canRead('tasks')) {
    return (
      <ProtectedComponent module="tasks" action="read">
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500">You don't have permission to view tasks.</p>
        </div>
      </ProtectedComponent>
    );
  }

  return (
    <div className="p-4 space-y-4 min-h-screen">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-blue-600" />
            Task Management
          </h1>
          <p className="text-sm text-gray-600 mt-1 ml-1">Organize, assign, and track all your tasks and activities.</p>
        </div>
        {canCreate('tasks') && (
          <Button onClick={() => { setSelectedTask(null); setIsFormOpen(true); }} className="clay-button bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:scale-105 transition-transform duration-200">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      <TaskStats stats={getTaskStats()} isLoading={isLoading} />

      <div className="clay-card p-2">
        <TaskToolbar 
          filters={filters} 
          onFiltersChange={setFilters}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="clay-element bg-gray-50">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All Tasks
              {!isLoading && <Badge variant="secondary">{filteredTasks.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="my_tasks" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Tasks
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Overdue
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array(8).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-500">No tasks found</h3>
                <p className="text-gray-400">Create a new task to get started.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => { setSelectedTask(task); setIsFormOpen(true); }}
                    onStatusChange={handleStatusChange}
                    users={users}
                    leads={leads}
                    opportunities={opportunities}
                    accounts={accounts}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl clay-card">
          <DialogHeader>
            <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            <DialogDescription>
              {selectedTask ? 'Update the task details.' : 'Fill in the details for the new task.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[80vh] overflow-y-auto px-2">
            <TaskForm
              task={selectedTask}
              onSave={handleFormSave}
              onCancel={() => setIsFormOpen(false)}
              users={users}
              leads={leads}
              opportunities={opportunities}
              accounts={accounts}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}