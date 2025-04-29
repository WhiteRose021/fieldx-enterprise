'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Technician {
  id: string;
  name: string;
  team: string;
}

type AppointmentType = 'construction' | 'splicing' | 'earthwork' | 'autopsy';

interface APIOption {
  id: AppointmentType;
  name: string;
  endpoint: string;
  team: string;
}

interface AppointmentSelectorProps {
  selectedAppointments: AppointmentType[];
  onAppointmentChange: (type: AppointmentType) => void;
  technicians: Technician[];
  selectedTechniciansByType: { [key in AppointmentType]?: Technician[] };
  onTechnicianChange: (type: AppointmentType, technicians: Technician[]) => void;
}

const APIs: APIOption[] = [
  { 
    id: 'construction', 
    name: 'ΡΑΝΤΕΒΟΥ ΚΑΤΑΣΚΕΥΑΣΤΙΚΟΥ', 
    endpoint: 'CKataskeyastikadates',
    team: 'Technicians - Construct'
  },
  { 
    id: 'splicing', 
    name: 'ΡΑΝΤΕΒΟΥ ΚΟΛΛΗΣΕΩΝ', 
    endpoint: 'CSplicingdate',
    team: 'Technicians - Splicers'
  },
  { 
    id: 'earthwork', 
    name: 'ΡΑΝΤΕΒΟΥ ΧΩΜΑΤΟΥΡΓΙΚΟΥ', 
    endpoint: 'CEarthWork',
    team: 'Technicians - Soil'
  },
  { 
    id: 'autopsy', 
    name: 'Ραντεβού Αυτοψίας', 
    endpoint: 'Test',
    team: 'Autopsy'
  }
];

const AppointmentSelector: React.FC<AppointmentSelectorProps> = ({
  selectedAppointments,
  onAppointmentChange,
  technicians,
  selectedTechniciansByType,
  onTechnicianChange,
}) => {
  const [expandedTypes, setExpandedTypes] = useState<AppointmentType[]>([]);

  const getFilteredTechnicians = (team: string) => {
    return technicians.filter(tech => tech.team === team);
  };

  const toggleExpanded = (type: AppointmentType) => {
    setExpandedTypes(current =>
      current.includes(type)
        ? current.filter(t => t !== type)
        : [...current, type]
    );
  };

  return (
    <div className="space-y-2">
      {APIs.map((api) => {
        const isExpanded = expandedTypes.includes(api.id);
        const isSelected = selectedAppointments.includes(api.id);
        const filteredTechs = getFilteredTechnicians(api.team);
        
        return (
          <div key={api.id} className="border rounded-lg bg-white shadow-sm">
            {/* Header */}
            <div className="p-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onAppointmentChange(api.id)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <button
                  className="flex-1 flex items-center justify-between ml-3 text-left"
                  onClick={() => toggleExpanded(api.id)}
                >
                  <span className="text-sm font-medium">{api.name}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200
                      ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Technicians List */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t"
                >
                  <div className="p-2 max-h-48 overflow-y-auto">
                    {filteredTechs.length > 0 ? (
                      filteredTechs.map((tech) => (
                        <div 
                          key={tech.id} 
                          className="flex items-center px-3 py-1.5 hover:bg-gray-50 rounded-md"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTechniciansByType[api.id]?.some(t => t.id === tech.id) ?? false}
                            onChange={() => {
                              const current = selectedTechniciansByType[api.id] || [];
                              const newSelection = current.some(t => t.id === tech.id)
                                ? current.filter(t => t.id !== tech.id)
                                : [...current, tech];
                              onTechnicianChange(api.id, newSelection);
                            }}
                            disabled={!isSelected}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {tech.name}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500 text-center py-2">
                        No technicians available
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default AppointmentSelector;