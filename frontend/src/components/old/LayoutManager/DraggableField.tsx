// src/components/LayoutManager/DraggableField.tsx
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { FieldConfig } from './types';

interface DraggableFieldProps {
  field: FieldConfig;
  onToggle: () => void;
}

export const DraggableField = ({ field, onToggle }: DraggableFieldProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border rounded-lg mb-2 hover:shadow-sm transition-all"
    >
      <button
        {...attributes}
        {...listeners}
        className="touch-none p-2 hover:bg-gray-50 rounded"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      
      <span className="flex-grow font-medium">{field.label}</span>
      
      <button
        onClick={onToggle}
        className="p-2 hover:bg-red-50 rounded group"
      >
        <X className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
      </button>
    </div>
  );
};