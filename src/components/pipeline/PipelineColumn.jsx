import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusColors = {
  new: 'bg-gray-200',
  contacted: 'bg-blue-200',
  qualified: 'bg-emerald-200',
  proposal_sent: 'bg-yellow-200',
  negotiation: 'bg-green-200',
  won: 'bg-teal-200'
};

export default function PipelineColumn({ column, children }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${statusColors[column.id]}`}></div>
          <h3 className="font-semibold text-lg text-gray-700">{column.title}</h3>
        </div>
        <span className="text-sm font-bold text-gray-500 bg-gray-100 py-1 px-2.5 rounded-full">
          {column.leads?.length || 0}
        </span>
      </div>
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`clay-card p-4 space-y-4 min-h-[60vh] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-emerald-50' : 'bg-white/50'
            }`}
          >
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}