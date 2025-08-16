import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

const stageColors = {
  qualification: 'bg-blue-200',
  needs_analysis: 'bg-yellow-200',
  proposal: 'bg-orange-200',
  negotiation: 'bg-purple-200',
  closed_won: 'bg-green-300',
  closed_lost: 'bg-red-300',
};

export default function OpportunityColumn({ stage, children }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${stageColors[stage.id] || 'bg-gray-200'}`}></div>
          <h3 className="font-semibold text-lg text-gray-700">{stage.title}</h3>
        </div>
        <span className="text-sm font-bold text-gray-500 bg-gray-100 py-1 px-2.5 rounded-full">
          {stage.items?.length || 0}
        </span>
      </div>
      <Droppable droppableId={stage.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`clay-card p-4 space-y-1 min-h-[60vh] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-emerald-50' : 'bg-gray-100/40'
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