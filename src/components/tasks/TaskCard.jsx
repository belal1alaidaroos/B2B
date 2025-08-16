import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  Clock, 
  User, 
  MoreVertical, 
  CheckCircle, 
  Play, 
  Pause, 
  AlertTriangle,
  MapPin,
  Tag,
  Building,
  Users,
  Target,
  Hash
} from 'lucide-react';
import { format, isPast, isToday, differenceInDays } from 'date-fns';

export default function TaskCard({ task, onEdit, onStatusChange, users, leads, opportunities, accounts }) {
  const assignedUser = users.find(u => u.id === task.assigned_to);
  const dueDate = new Date(task.due_date);
  const isOverdue = isPast(dueDate) && task.status !== 'completed';
  const isDueToday = isToday(dueDate);
  const daysUntilDue = differenceInDays(dueDate, new Date());

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    on_hold: 'bg-yellow-100 text-yellow-800'
  };

  const taskTypeIcons = {
    call: '📞',
    email: '✉️',
    meeting: '🤝',
    follow_up: '🔄',
    demo: '🖥️',
    proposal: '📋',
    contract_review: '📑',
    document_prep: '📄',
    research: '🔍',
    training: '🎓',
    admin: '⚙️',
    other: '📌'
  };

  const getRelatedEntityInfo = () => {
    if (!task.related_entity_type || !task.related_entity_id) return null;
    
    let entity = null;
    let icon = null;
    
    switch (task.related_entity_type) {
      case 'lead':
        entity = leads.find(l => l.id === task.related_entity_id);
        icon = <Users className="w-3 h-3" />;
        break;
      case 'opportunity':
        entity = opportunities.find(o => o.id === task.related_entity_id);
        icon = <Target className="w-3 h-3" />;
        break;
      case 'account':
        entity = accounts.find(a => a.id === task.related_entity_id);
        icon = <Building className="w-3 h-3" />;
        break;
      case 'user':
        entity = users.find(u => u.id === task.related_entity_id);
        icon = <User className="w-3 h-3" />;
        break;
    }
    
    if (!entity) return null;
    
    const entityName = entity.company_name || entity.name || entity.full_name || `${entity.first_name} ${entity.last_name}`;
    
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        {icon}
        <span className="truncate">{entityName}</span>
      </div>
    );
  };

  return (
    <Card className={`clay-card hover:shadow-lg transition-all duration-200 ${
      isOverdue ? 'border-red-200 bg-red-50/30' : 
      isDueToday ? 'border-yellow-200 bg-yellow-50/30' : 
      'bg-white/80'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{taskTypeIcons[task.task_type]}</span>
              <h3 className="font-semibold text-gray-800 truncate cursor-pointer hover:text-blue-600" onClick={onEdit}>
                {task.title}
              </h3>
            </div>
            {task.task_number && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <Hash className="w-3 h-3" />
                <span className="font-mono">{task.task_number}</span>
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                Edit Task
              </DropdownMenuItem>
              {task.status !== 'completed' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'completed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {task.status === 'pending' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'in_progress')}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Task
                </DropdownMenuItem>
              )}
              {task.status === 'in_progress' && (
                <DropdownMenuItem onClick={() => onStatusChange(task.id, 'on_hold')}>
                  <Pause className="w-4 h-4 mr-2" />
                  Put On Hold
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={priorityColors[task.priority]} variant="secondary">
            {task.priority}
          </Badge>
          <Badge className={statusColors[task.status]} variant="secondary">
            {task.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
        )}

        {task.progress_percentage > 0 && (
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{task.progress_percentage}%</span>
            </div>
            <Progress value={task.progress_percentage} className="h-2" />
          </div>
        )}

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-3 h-3" />
            <span>{assignedUser?.full_name || assignedUser?.first_name}</span>
          </div>
          
          <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : 'text-gray-500'}`}>
            {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
            <span>
              {isOverdue ? 'Overdue' : isDueToday ? 'Due today' : 
                daysUntilDue > 0 ? `Due in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}` : 
                format(dueDate, 'MMM d, yyyy')}
            </span>
          </div>

          {task.estimated_duration && (
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{task.estimated_duration} min</span>
            </div>
          )}

          {task.location && (
            <div className="flex items-center gap-2 text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{task.location}</span>
            </div>
          )}

          {getRelatedEntityInfo()}

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="w-3 h-3 text-gray-400" />
              {task.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-gray-400">+{task.tags.length - 2} more</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}