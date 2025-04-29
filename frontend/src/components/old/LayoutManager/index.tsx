"use client";

import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface Field {
  id: string;
  label: string;
  type: string;
  enabled: boolean;
}

interface LayoutProps {
  fields: Field[];
  onSave: (updatedFields: Field[]) => void;
}

export const LayoutManager = ({ fields, onSave }: LayoutProps) => {
  const [layoutFields, setLayoutFields] = useState(fields);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedFields = Array.from(layoutFields);
    const [removed] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, removed);

    setLayoutFields(reorderedFields);
  };

  const handleToggleField = (id: string) => {
    setLayoutFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, enabled: !field.enabled } : field
      )
    );
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {layoutFields.map((field, index) => (
                <Draggable key={field.id} draggableId={field.id} index={index}>
                  {(provided) => (
                    <div
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        field.enabled ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <span>{field.label}</span>
                      <button
                        onClick={() => handleToggleField(field.id)}
                        className={`px-2 py-1 rounded ${
                          field.enabled
                            ? "bg-red-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {field.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      <button
        onClick={() => onSave(layoutFields)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Save Layout
      </button>
    </div>
  );
};
