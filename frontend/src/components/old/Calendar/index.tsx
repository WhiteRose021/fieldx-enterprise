"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, X, Calendar, 
  Plus, Check, Edit, Trash, User, Users, Clock, Loader,
  Filter, AlertCircle, LocateFixed, RefreshCw, MapPin, Sliders,
  Tag,
  FileText
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { el } from 'date-fns/locale';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  format,
  getMonth,
  getYear,
  addDays,
  startOfDay,
  addWeeks,
  subWeeks,
  getWeek,
  parseISO,
  setHours,
  getDay,
  getDate,
} from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";
import dynamic from 'next/dynamic';
import EventDetailModal from './EventDetailModal';


// Define AppointmentType as enum for better type checking
enum AppointmentTypeEnum {
  CONSTRUCTION = 'CONSTRUCTION',
  SPLICING = 'SPLICING',
  EARTHWORK = 'EARTHWORK',
  AUTOPSY = 'AUTOPSY'
}

// Define appointment type labels
const APPOINTMENT_TYPE_LABELS = {
  AUTOPSY: "Αυτοψίες",
  CONSTRUCTION: "Κατασκευές",
  SPLICING: "Κολλήσεις",
  EARTHWORK: "Χωματουργικά",
};

// Mapping team names to appointment types
const TEAM_TO_APPOINTMENT_TYPE = {
  'Autopsy': 'AUTOPSY',
  'Technicians - Construct': 'CONSTRUCTION',
  'Technicians - Splicers': 'SPLICING',
  'Technicians - Soil': 'EARTHWORK',
};

// Define the appointment type order
const APPOINTMENT_TYPE_ORDER = ['AUTOPSY', 'CONSTRUCTION', 'SPLICING', 'EARTHWORK'];

// Background colors for job modal sections
const APPOINTMENT_TYPE_COLORS = {
  AUTOPSY: "bg-purple-50",
  CONSTRUCTION: "bg-green-50",
  SPLICING: "bg-blue-50",
  EARTHWORK: "bg-orange-50",
};

// Greek translations for team names
const TEAM_NAME_TRANSLATIONS = {
  "Technicians - Construct": "Κατασκευαστής",
  "Technicians - Splicers": "Τεχνικός Κολλήσεων",
  "Technicians - Soil": "Χωματουργός",
  "Autopsy": "Τεχνικός Αυτοψίας",
};

// Helper function to translate team names
const translateTeamName = (team: string | number) => {
  return TEAM_NAME_TRANSLATIONS[team] || team;
};

// Greek translations
const GREEK_TRANSLATIONS = {
  months: [
    "Ιανουάριος", "Φεβρουάριος", "Μάρτιος", "Απρίλιος", "Μάιος", "Ιούνιος",
    "Ιούλιος", "Αύγουστος", "Σεπτέμβριος", "Οκτώβριος", "Νοέμβριος", "Δεκέμβριος"
  ],
  weekDays: [
    "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο", "Κυριακή"
  ],
  weekDaysShort: ["Δευ", "Τρί", "Τετ", "Πέμ", "Παρ", "Σάβ", "Κυρ"],
  view: {
    day: "Ημέρα",
    week: "Εβδομάδα",
    month: "Μήνας"
  },
  buttons: {
    close: "Κλείσιμο",
    apply: "Εφαρμογή",
    cancel: "Ακύρωση",
    save: "Αποθήκευση",
    details: "Λεπτομέρειες",
    filters: "Φίλτρα",
    mapView: "Προβολή Χάρτη",
    selectAll: "Επιλογή όλων",
    selectNone: "Κανένα",
    loading: "Φόρτωση...",
  },
  labels: {
    eventSchedule: "Ημερολόγιο Εργασιών",
    calendarFilters: "Φίλτρα ημερολογίου",
    appointmentTypes: "Τύποι Ραντεβού",
    technicalTeams: "Ομάδες Τεχνικών",
    technicians: "Τεχνικοί",
    selected: "Επιλεγμένοι",
    from: "από",
    noEvents: "Δεν υπάρχουν εργασίες",
    construction: "Κατασκευές",
    splicing: "Κολλήσεις",
    earthwork: "Χωματουργικά",
    autopsy: "Αυτοψίες",
    eventsFor: "Εργασίες για",
    workDetails: "Λεπτομέρειες Εργασίας",
  }
};

// Types
type AppointmentType = keyof typeof AppointmentTypeEnum;

// Define EventStatus for better type safety
type EventStatus = 'ΟΛΟΚΛΗΡΩΣΗ' | 'ΑΠΟΣΤΟΛΗ' | 'ΑΠΟΡΡΙΨΗ' | 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ' | 'default';

interface Event {
  id: string;
  name: string;
  start: Date;
  end: Date;
  technicianName: string;
  technicianId?: string;
  type?: string;
  sr?: string;
  srText?: string;
  testRecordId?: string;
  appointmentType?: AppointmentType;
  area?: string;
  details?: string;
  status?: EventStatus;
  rowPosition?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  }
}

interface Technician {
  id: string;
  name: string;
  team: string;
}

// Work Details interface
interface WorkDetails {
  id: string;
  title: string;
  address: string;
  area: string;
  sr: string;
  status: string;
  difficulty: string;
  difficultyValue: string;
  jobType: string;
  estimatedHours: string;
  priority: string;
  requiredTechnicians: string;
  channels: boolean;
  excavation: boolean;
  conduit: boolean;
  ftu: boolean;
  usage: boolean;
  bmo: string;
  bcp: boolean;
  description: string;
  team: string;
  date: string;
  timeSlot: string;
  latitude: number;
  longitude: number;
}

// Interfaces for various components
interface DayEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: Event[];
  onEventClick: (event: Event) => void;
}

interface TechnicianModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  technicians: Technician[];
  onSelectTechnician: (technicianId: string) => void;
  onViewAll: () => void;
  activeTeamFilters: Record<string, boolean>;
}

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: Event[];
  technician: Technician | null;
  isAllTechnicians: boolean;
  onEdit: (event: Event) => void;
  onViewDetails: (testRecordId: string, appointmentType?: string) => Promise<void>;
  onEventClick: (event: Event) => void;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  technicianName?: string;
  onViewDetails: (testRecordId: string, appointmentType?: string) => Promise<void>;
  onEdit?: (event: Event) => void;
}

interface WorkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  appointmentType: string;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: Record<AppointmentType, boolean>;
  activeTechnicianFilters: Record<string, boolean>;
  onFilterChange: (filters: Record<AppointmentType, boolean>) => void;
  onTechnicianFilterChange: (filters: Record<string, boolean>) => void;
  technicians: Technician[];
}

interface InitialsAvatarProps {
  name: string;
  className?: string;
}

// API Configurations
const API_CONFIGS = {
  'Test': { bg: "bg-purple-500", border: "border-purple-600", shadow: "shadow-purple-500/20", text: "text-purple-700", icon: User, label: 'Αυτοψίες' },
  'CSplicingWork': { bg: "bg-blue-500", border: "border-blue-600", shadow: "shadow-blue-500/20", text: "text-blue-700", icon: User, label: 'Κολλήσεις', statusColors: { 'ΝΕΟ': { bg: "bg-blue-500", border: "border-blue-600", shadow: "shadow-blue-500/20", text: "text-blue-700" }, 'ΑΠΟΣΤΟΛΗ': { bg: "bg-orange-500", border: "border-orange-600", shadow: "shadow-orange-500/20", text: "text-orange-700" } } },
  'CEarthWork': { bg: "bg-orange-500", border: "border-orange-600", shadow: "shadow-orange-500/20", text: "text-orange-700", icon: User, label: 'Χωματουργικά' },
  'CKataskeyastikadates': { bg: "bg-green-500", border: "border-green-600", shadow: "shadow-green-500/20", text: "text-green-700", icon: User, label: 'Κατασκευές' }
};

const CONSTRUCTION_API_ENDPOINTS = [
  'http://192.168.4.150:8080/api/v1/Test',
  'http://192.168.4.150:8080/api/v1/CSplicingWork',
  'http://192.168.4.150:8080/api/v1/CKataskeyastikadates',
  'http://192.168.4.150:8080/api/v1/CEarthWork'
];

const APIs = [
  { id: 'CONSTRUCTION', name: 'Ραντεβού Κατασκευαστικού', endpoint: 'CKataskeyastikadates', team: 'Technicians - Construct' },
  { id: 'SPLICING', name: 'Ραντεβού Κολλήσεων', endpoint: 'CSplicingdate', team: 'Technicians - Splicers' },
  { id: 'EARTHWORK', name: 'Ραντεβού Χωματουργικού', endpoint: 'CEarthWork', team: 'Technicians - Soil' },
  { id: 'AUTOPSY', name: 'Ραντεβού Αυτοψίας', endpoint: 'Test', team: 'Autopsy' }
];

// Event style mapping with proper typing
const EVENT_STYLES: Record<EventStatus | string, string> = {
  'ΟΛΟΚΛΗΡΩΣΗ': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'ΑΠΟΣΤΟΛΗ': 'bg-blue-50 border-blue-200 text-blue-700',
  'ΑΠΟΡΡΙΨΗ': 'bg-yellow-50 border-yellow-200 text-yellow-700',
  'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': 'bg-red-50 border-red-200 text-red-700',
  'default': 'bg-gray-50 border-gray-200 text-gray-700'
};

// Helper function to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('.')
    .toUpperCase();
};

// Helper function to generate color from string
const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#E11D48', '#7C3AED', '#2563EB', '#0891B2', '#059669', '#EA580C', '#9333EA', '#C026D3', '#0D9488', '#65A30D',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Initials Avatar Component
const InitialsAvatar: React.FC<InitialsAvatarProps> = ({ name, className = "" }) => {
  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);

  return (
    <div
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{ backgroundColor }}
    >
      <span className="text-white font-bold">
        {initials}
      </span>
    </div>
  );
};

// Utility function for chunking arrays (splitting days into weeks)
const chunk = <T,>(arr: T[], size: number): T[][] => {
  const chunked: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunked.push(arr.slice(i, i + size));
  }
  return chunked;
};

// Get Event Style Function
const getEventStyle = (status?: string): string => {
  return EVENT_STYLES[status || 'default'] || EVENT_STYLES.default;
};

// Views enum
enum CalendarView {
  Week = 'week',
  Month = 'month'
}

// FilterPanel Component with team filters
const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  activeFilters,
  activeTechnicianFilters,
  onFilterChange,
  onTechnicianFilterChange,
  technicians
}) => {
  const [tempFilters, setTempFilters] = useState<Record<AppointmentType, boolean>>(activeFilters);
  const [tempTechnicianFilters, setTempTechnicianFilters] = useState<Record<string, boolean>>(activeTechnicianFilters);
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});
  
  // Get unique teams from technicians
  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    technicians.forEach(tech => {
      if (tech.team) teams.add(tech.team);
    });
    return Array.from(teams).sort((a, b) => {
      const aType = TEAM_TO_APPOINTMENT_TYPE[a] || "";
      const bType = TEAM_TO_APPOINTMENT_TYPE[b] || "";
      return APPOINTMENT_TYPE_ORDER.indexOf(aType as AppointmentType) - APPOINTMENT_TYPE_ORDER.indexOf(bType as AppointmentType);
    });
  }, [technicians]);
  
  useEffect(() => {
    if (isOpen) {
      setTempFilters({...activeFilters});
      setTempTechnicianFilters({...activeTechnicianFilters});
    }
  }, [isOpen, activeFilters, activeTechnicianFilters]);
  
  const handleFilterToggle = (type: AppointmentType) => {
    setTempFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  const handleTechnicianFilterToggle = (techId: string) => {
    setTempTechnicianFilters(prev => ({
      ...prev,
      [techId]: !prev[techId]
    }));
  };
  
  const toggleTeam = (team: string) => {
    setOpenTeams(prev => ({
      ...prev,
      [team]: !prev[team]
    }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    onTechnicianFilterChange(tempTechnicianFilters);
    onClose();
  };
  
  const handleSelectAllTypes = () => {
    setTempFilters(Object.keys(tempFilters).reduce((acc, key) => {
      acc[key as AppointmentType] = true;
      return acc;
    }, {} as Record<AppointmentType, boolean>));
  };
  
  const handleSelectNoneTypes = () => {
    setTempFilters(Object.keys(tempFilters).reduce((acc, key) => {
      acc[key as AppointmentType] = false;
      return acc;
    }, {} as Record<AppointmentType, boolean>));
  };
  
  const handleSelectAllTechniciansForTeam = (team: string) => {
    const teamTechnicians = technicians.filter(tech => tech.team === team);
    setTempTechnicianFilters(prev => ({
      ...prev,
      ...teamTechnicians.reduce((acc, tech) => {
        acc[tech.id] = true;
        return acc;
      }, {} as Record<string, boolean>)
    }));
  };
  
  const handleSelectNoneTechniciansForTeam = (team: string) => {
    const teamTechnicians = technicians.filter(tech => tech.team === team);
    setTempTechnicianFilters(prev => ({
      ...prev,
      ...teamTechnicians.reduce((acc, tech) => {
        acc[tech.id] = false;
        return acc;
      }, {} as Record<string, boolean>)
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-aspro text-left shadow-xl sm:my-8 sm:w-full sm:max-w-md max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-gray-500" />
              Φίλτρα Ημερολογίου
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="px-4 py-3 max-h-[80vh] overflow-y-auto">
            {/* Appointment Categories Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-md font-medium text-gray-700">Κατηγορίες Ραντεβού</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectAllTypes}
                  >
                    Επιλογή Όλων
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectNoneTypes}
                  >
                    Κανένα
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {APPOINTMENT_TYPE_ORDER.map((type) => (
                  <div 
                    key={type}
                    className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                    onClick={() => handleFilterToggle(type)}
                  >
                    <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempFilters[type] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {tempFilters[type] && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-medium">{APPOINTMENT_TYPE_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Technicians Grouped by Category with Dropdown */}
            <div className="mb-4">
              <label className="block text-md font-medium text-gray-700 mb-2">Τεχνικοί ανά Κατηγορία</label>
              {uniqueTeams.map((team) => {
                const appointmentType = TEAM_TO_APPOINTMENT_TYPE[team];
                const label = appointmentType ? APPOINTMENT_TYPE_LABELS[appointmentType] : translateTeamName(team);
                const teamTechnicians = technicians.filter((tech) => tech.team === team);
                const isOpen = openTeams[team] || false;
                return (
                  <div key={team} className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => toggleTeam(team)}
                      >
                        {isOpen ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                        <span className="font-medium">Τεχνικοί για {label}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => handleSelectAllTechniciansForTeam(team)}
                        >
                          Επιλογή Όλων
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => handleSelectNoneTechniciansForTeam(team)}
                        >
                          Κανένα
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {teamTechnicians.map((tech, index) => (
                          <div
                            key={tech.id}
                            className={`px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center ${index >= 3 ? "scroll-mt-2" : ""}`}
                            onClick={() => handleTechnicianFilterToggle(tech.id)}
                          >
                            <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempTechnicianFilters[tech.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                              {tempTechnicianFilters[tech.id] && <Check className="w-4 h-4 text-white" />}
                            </div>
                            <span>{tech.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse border-t">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              onClick={handleApplyFilters}
            >
              Εφαρμογή
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-aspro px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Ακύρωση
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Day Events Modal (Shows events for a specific day)
// Day Events Modal with appointment type categorization
const DayEventsModal: React.FC<DayEventsModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  events,
  onEventClick
}) => {
  if (!isOpen || !date) return null;

  // Get grid column class based on number of active categories
  const getCategorizedEvents = () => {
    const categorized: Record<AppointmentType, Event[]> = {
      'CONSTRUCTION': [],
      'SPLICING': [],
      'EARTHWORK': [],
      'AUTOPSY': []
    };

    events.forEach(event => {
      const type = event.appointmentType || 'CONSTRUCTION';
      if (type in categorized) {
        categorized[type as AppointmentType].push(event);
      }
    });

    return categorized;
  };

  const categorizedEvents = getCategorizedEvents();
  
  // Get active categories (those with events)
  const activeCategories = Object.keys(categorizedEvents).filter(
    type => categorizedEvents[type as AppointmentType].length > 0
  );

  // Determine grid columns based on active categories count
  const getGridColClass = () => {
    const count = activeCategories.length;
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-1 md:grid-cols-2";
    if (count === 3) return "grid-cols-1 md:grid-cols-3";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
  };

  const gridColClass = getGridColClass();

  // Colors for appointment types
  const APPOINTMENT_TYPE_COLORS: Record<string, string> = {
    'CONSTRUCTION': 'bg-green-50 border-green-200',
    'SPLICING': 'bg-blue-50 border-blue-200',
    'EARTHWORK': 'bg-orange-50 border-orange-200',
    'AUTOPSY': 'bg-purple-50 border-purple-200'
  };

  // Order for display
  const APPOINTMENT_TYPE_ORDER: AppointmentType[] = ['CONSTRUCTION', 'SPLICING', 'EARTHWORK', 'AUTOPSY'];

  const formattedDate = format(date, 'd MMMM yyyy', { locale: el });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9000] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-aspro rounded-lg shadow-lg w-[95%] max-w-6xl h-[90vh] max-h-[800px] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 z-10 bg-aspro">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            {GREEK_TRANSLATIONS.labels.eventsFor} {formattedDate}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Κλείσιμο"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-lg">
              {GREEK_TRANSLATIONS.labels.noEvents}
            </div>
          ) : (
            <div className={`grid ${gridColClass} gap-6`}>
              {APPOINTMENT_TYPE_ORDER.map((type) => {
                // Skip categories with no events
                if (categorizedEvents[type].length === 0) return null;
                
                return (
                  <div key={type} className={`${APPOINTMENT_TYPE_COLORS[type]} p-4 rounded-lg border shadow-sm`}>
                    <h3 className="font-medium text-lg mb-3 flex items-center">
                      {type === 'CONSTRUCTION' && <Tag className="h-5 w-5 mr-2 text-green-600" />}
                      {type === 'SPLICING' && <Check className="h-5 w-5 mr-2 text-blue-600" />}
                      {type === 'EARTHWORK' && <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />}
                      {type === 'AUTOPSY' && <FileText className="h-5 w-5 mr-2 text-purple-600" />}
                      {type === 'CONSTRUCTION' ? GREEK_TRANSLATIONS.labels.construction : 
                       type === 'SPLICING' ? GREEK_TRANSLATIONS.labels.splicing : 
                       type === 'EARTHWORK' ? GREEK_TRANSLATIONS.labels.earthwork : 
                       GREEK_TRANSLATIONS.labels.autopsy}
                    </h3>
                    
                    <div className="space-y-3 max-h-[calc(90vh-200px)] overflow-y-auto pr-2">
                      {categorizedEvents[type].map((event) => (
                        <div
                          key={event.id}
                          className="p-3 bg-aspro rounded-md shadow-sm hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                          onClick={() => onEventClick(event)}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-gray-800">{event.name}</h4>
                            {event.status && (
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getEventStyle(event.status)}`}>
                                {event.status}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2 flex items-center text-gray-600 text-sm">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</span>
                          </div>
                          
                          {event.technicianName && (
                            <div className="mt-2 flex items-center text-gray-600 text-sm">
                              <User className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{event.technicianName}</span>
                            </div>
                          )}
                          
                          {event.area && (
                            <div className="mt-2 flex items-center text-gray-600 text-sm">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              <span>{event.area}</span>
                            </div>
                          )}
                          
                          {event.sr && (
                            <div className="mt-2 text-gray-600 text-sm pl-6">
                              <span className="font-medium">SR:</span> {event.sr}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {GREEK_TRANSLATIONS.buttons.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Technician selection modal
const TechnicianModal: React.FC<TechnicianModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  technicians,
  onSelectTechnician,
  onViewAll,
  activeTeamFilters
}) => {
  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-aspro rounded-lg shadow-xl overflow-hidden w-full max-w-md">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{`Τεχνικοί για ${format(date, 'd MMMM yyyy', { locale: el })}`}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-600">Επιλέξτε έναν τεχνικό για να δείτε το πρόγραμμά του:</p>
            <div className="divide-y max-h-64 overflow-auto">
              {technicians.map(tech => {
                // Check if this technician's team is filtered out
                const isTeamFiltered = tech.team && !activeTeamFilters[tech.team];
                
                return (
                  <button
                    key={tech.id}
                    className={`w-full py-3 px-4 text-left hover:bg-gray-50 flex items-center justify-between ${
                      isTeamFiltered ? 'opacity-50' : ''
                    }`}
                    onClick={() => onSelectTechnician(tech.id)}
                  >
                    <div className="flex items-center">
                      <InitialsAvatar
                        name={tech.name}
                        className="w-8 h-8 mr-3 text-sm"
                      />
                      <div>
                        <div className="font-medium">{tech.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          {tech.team}
                          {isTeamFiltered && (
                            <span className="ml-2 px-1 py-0.5 bg-gray-100 text-xs rounded text-gray-700 flex items-center">
                              <X size={8} className="mr-0.5" /> Filtered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                );
              })}
            </div>
            <button
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              onClick={onViewAll}
            >
              Προβολή Όλων
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Schedule details modal
const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  date, 
  events,
  technician,
  isAllTechnicians,
  onEdit,
  onViewDetails,
  onEventClick
}) => {
  if (!isOpen || !date) return null;

  const title = technician 
    ? `${technician.name} - ${format(date, 'd MMMM yyyy', { locale: el })}` 
    : `Όλα τα προγράμματα για ${format(date, 'd MMMM yyyy', { locale: el })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-gray-100 z-10">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {events.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {GREEK_TRANSLATIONS.labels.noEvents}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {events.map(event => (
                <div 
                  key={event.id}
                  className="bg-aspro border border-green-100 rounded-lg p-4 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onEventClick(event)}
                >
                  <div className="flex justify-between">
                    <h4 className="font-semibold text-green-700">{event.name}</h4>
                    <Edit 
                      size={18} 
                      className="text-blue-500 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the parent onClick
                        onEdit(event);
                      }}
                    />
                  </div>
                  
                  <div className="mt-2 flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{format(new Date(event.start), 'HH:mm')} - {format(new Date(event.end), 'HH:mm')}</span>
                  </div>
                  
                  {event.sr && (
                    <div className="mt-2 text-gray-600">
                      <span className="font-medium">SR: </span>{event.sr}
                    </div>
                  )}
                  
                  {isAllTechnicians && event.technicianName && (
                    <div className="mt-2 flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>{event.technicianName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50 sticky bottom-0">
          <button
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={onClose}
          >
            {GREEK_TRANSLATIONS.buttons.close}
          </button>
        </div>
      </div>
    </div>
  );
};

// Map Component for EventDetailModal
const EventMap: React.FC<{ location: { latitude: number; longitude: number; address: string } }> = ({ location }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!location || !mapContainer.current) return;
    
    // For now, just simulate loading
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [location]);

  return (
    <div className="h-48 bg-blue-50 rounded-lg overflow-hidden">
      <div 
        ref={mapContainer} 
        className="w-full h-full"
      >
        {!loaded ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">{location.address}</p>
              <p className="text-sm text-gray-500 mt-1">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


// Event Edit Form
interface EventEditFormProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedEvent: Event) => void;
}

// Event Edit Form component
const EventEditForm: React.FC<EventEditFormProps> = ({
  event,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedEvent, setEditedEvent] = useState<Event>({...event});
  const [duration, setDuration] = useState<string>("1h");
  
  useEffect(() => {
    if (isOpen) {
      setEditedEvent({...event});
      
      // Calculate duration
      const start = new Date(event.start);
      const end = new Date(event.end);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      setDuration(`${diffHours}h`);
    }
  }, [event, isOpen]);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    // Update end time based on duration
    const startTime = new Date(editedEvent.start);
    const [hours] = duration.split('h');
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + parseInt(hours));
    
    const updatedEvent = {
      ...editedEvent,
      end: endTime
    };
    
    onSave(updatedEvent);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-aspro rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] m-4 overflow-hidden">
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h3 className="font-medium">ΕΠΕΞΕΡΓΑΣΙΑ · {event.appointmentType || 'ΡΑΝΤΕΒΟΥ'}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ΕΝΑΡΞΗ ΠΑΝΤΕΒΟΥ</label>
              <div className="text-gray-700">
                {format(new Date(editedEvent.start), 'yyyy-MM-dd HH:mm')}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ΔΙΑΡΚΕΙΑ</label>
              <div className="relative">
                <select 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1h">1h</option>
                  <option value="2h">2h</option>
                  <option value="3h">3h</option>
                  <option value="4h">4h</option>
                  <option value="5h">5h</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ΑΠΑΙΤΕΙΤΑΙ ΕΚΔΟΣΗ ΟΛΕΡΑΤ;</label>
              <div className="relative">
                <select 
                  value={editedEvent.details?.includes('ΟΛΕΡΑΤ') ? 'ΝΑΙ' : 'ΟΧΙ'}
                  onChange={(e) => setEditedEvent({
                    ...editedEvent,
                    details: e.target.value === 'ΝΑΙ' 
                      ? (editedEvent.details || '') + ' ΟΛΕΡΑΤ' 
                      : (editedEvent.details || '').replace('ΟΛΕΡΑΤ', '')
                  })}
                  className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ΟΧΙ">ΟΧΙ</option>
                  <option value="ΝΑΙ">ΝΑΙ</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ΣΧΟΛΙΑ</label>
              <textarea
                value={editedEvent.details || ''}
                onChange={(e) => setEditedEvent({...editedEvent, details: e.target.value})}
                className="w-full p-2 border rounded min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter comments here..."
              />
            </div>
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ΧΡΗΣΤΗΣ</label>
              <div className="relative">
                <input
                  type="text"
                  value={editedEvent.technicianName}
                  onChange={(e) => setEditedEvent({...editedEvent, technicianName: e.target.value})}
                  className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">ΟΜΑΔΑ</label>
              <div className="border p-2 rounded flex justify-between items-center bg-aspro">
                <span>Engineers</span>
                <X className="h-4 w-4 text-gray-500" />
              </div>
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Select"
                  className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t p-4 bg-gray-50 flex">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
          >
            ΑΠΟΘΗΚΕΥΣΗ
          </button>
          <button
            className="px-4 py-2 bg-aspro border border-gray-300 text-gray-700 rounded hover:bg-gray-100 mr-2"
          >
            ΣΤΟΙΧΕΙΑ ΕΡΓΑΣΙΑΣ
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-aspro border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
          >
            ΑΚΥΡΩΣΗ
          </button>
        </div>
      </div>
    </div>
  );
};

const MapViewModal = dynamic(() => import('./MapViewModal'), { 
  ssr: false 
});


// Week View Component
const WeekView: React.FC<{
  currentDate: Date;
  events: Event[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}> = ({ currentDate, events, onDayClick, onEventClick }) => {
  // Get the current week's start and end dates
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start the week on Monday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
  // Get all days in the current week
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  // Hours to display in the week view (from 7:00 to 20:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  
  // Group events by day
  const eventsByDay = useMemo(() => {
    return weekDays.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      return events.filter(event => format(new Date(event.start), 'yyyy-MM-dd') === dayKey);
    });
  }, [weekDays, events]);

  return (
    <div className="bg-aspro border rounded-lg shadow-md overflow-hidden">
      <div className="grid grid-cols-8 divide-x">
        {/* Hour column */}
        <div className="bg-gray-50 p-2 border-b">
          <div className="h-12 flex items-center justify-center font-medium text-gray-500">
            Ώρα
          </div>
        </div>
        
        {/* Day headers */}
        {weekDays.map((day, index) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div 
              key={`day-header-${index}`} 
              className={`p-2 border-b cursor-pointer hover:bg-gray-50 ${isToday ? 'bg-blue-50' : ''}`}
              onClick={() => onDayClick(day)}
            >
              <div className="h-12 flex flex-col items-center justify-center">
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                  {GREEK_TRANSLATIONS.weekDaysShort[index]}
                </div>
                <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Time slots grid */}
      <div className="grid grid-cols-8 divide-x">
        {/* Hour labels */}
        <div className="bg-gray-50">
          {hours.map(hour => (
            <div 
              key={`hour-${hour}`} 
              className="border-b h-16 px-2 flex items-center justify-center"
            >
              <div className="text-sm font-medium text-gray-500">
                {hour}:00
              </div>
            </div>
          ))}
        </div>
        
        {/* Days columns */}
        {weekDays.map((day, dayIndex) => {
          const dayEvents = eventsByDay[dayIndex];
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={`day-column-${dayIndex}`} 
              className={`relative ${isToday ? 'bg-blue-50' : ''}`}
            >
              {/* Time slots */}
              {hours.map(hour => (
                <div 
                  key={`slot-${dayIndex}-${hour}`} 
                  className="border-b h-16 hover:bg-gray-50"
                ></div>
              ))}
              
              {/* Day's events */}
              <div className="absolute inset-0 p-1 pointer-events-none">
                {dayEvents.map(event => {
                  const eventStart = new Date(event.start);
                  const eventEnd = new Date(event.end);
                  const startHour = eventStart.getHours();
                  const startMinute = eventStart.getMinutes();
                  const endHour = eventEnd.getHours();
                  const endMinute = eventEnd.getMinutes();
                  
                  // Skip events that start before 7:00 or after 20:00
                  if (startHour < 7 || startHour >= 21) return null;
                  
                  // Calculate position and height
                  const topPosition = (startHour - 7) * 64 + (startMinute / 60) * 64;
                  const eventHeight = ((endHour - startHour) * 60 + (endMinute - startMinute)) / 60 * 64;
                  
                  return (
                    <div
                      key={`event-${event.id}`}
                      className={`absolute left-1 right-1 rounded-md p-1 border shadow-sm overflow-hidden cursor-pointer pointer-events-auto ${getEventStyle(event.status)}`}
                      style={{ 
                        top: `${topPosition}px`, 
                        height: `${Math.max(eventHeight, 24)}px`
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="text-xs font-medium truncate">
                        {format(eventStart, 'HH:mm')} - {event.name}
                      </div>
                      <div className="text-xs truncate">{event.technicianName}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Month View
const MonthView: React.FC<{
  currentDate: Date;
  events: Event[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}> = ({ currentDate, events, onDayClick, onEventClick }) => {
  // Get days for the current month view
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, Event[]>>((acc, event) => {
      const dateKey = format(new Date(event.start), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

  // Organize days into weeks
  const weeks = useMemo(() => {
    return chunk(daysInMonth, 7);
  }, [daysInMonth]);

  // Get the number of events for a specific date
  const getEventCountForDate = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return (eventsByDate[dateKey] || []).length;
  };

  // Render day events
  const renderDayEvents = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateEvents = eventsByDate[dateKey] || [];
    const maxEventsToShow = 3;
    const eventsToShow = dateEvents.slice(0, maxEventsToShow);

    return (
      <div className="space-y-1 mt-1">
        {eventsToShow.map(event => (
          <div
            key={event.id}
            className={`text-xs truncate p-1 rounded-lg ${getEventStyle(event.status)} cursor-pointer hover:bg-opacity-80`}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
          >
            <div className="flex items-center">
              <span className="font-medium mr-1">{format(new Date(event.start), 'HH:mm')}</span>
              <span className="truncate">{event.name}</span>
            </div>
          </div>
        ))}
        {dateEvents.length > maxEventsToShow && (
          <div className="text-xs text-gray-500 pl-1">
            +{dateEvents.length - maxEventsToShow} περισσότερα
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-7 bg-aspro border rounded-lg shadow-md overflow-hidden">
      {/* Day headers */}
      {GREEK_TRANSLATIONS.weekDaysShort.map((day, index) => (
        <div 
          key={`day-header-${index}`}
          className={`p-2 text-center font-medium border-b ${index < 6 ? 'border-r' : ''} text-gray-700`}
        >
          {day}
        </div>
      ))}
      
      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <React.Fragment key={`week-${weekIndex}`}>
          {week.map((day, dayIndex) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayEventsCount = getEventCountForDate(day);
            const isLastColumn = dayIndex === 6;
            const isLastRow = weekIndex === weeks.length - 1;
            
            return (
              <div 
                key={`day-${dayIndex}`}
                className={`min-h-[120px] p-2 cursor-pointer ${!isLastRow ? 'border-b' : ''} ${!isLastColumn ? 'border-r' : ''} ${
                  isCurrentMonth ? 'bg-aspro' : 'bg-gray-50 text-gray-400'
                } ${isToday ? 'border-blue-500 border-2' : ''}`}
                onClick={() => onDayClick(day)}
              >
                <div className="flex justify-between items-center">
                  <div className={`text-lg font-medium ${isToday ? 'text-blue-500' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  {dayEventsCount > 0 && (
                    <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                      {dayEventsCount}
                    </div>
                  )}
                </div>
                
                {isCurrentMonth && renderDayEvents(day)}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

// Work Details Modal Component
const WorkDetailsModal: React.FC<WorkDetailsModalProps> = ({
  isOpen,
  onClose,
  recordId,
  appointmentType,
}) => {
  const [workDetails, setWorkDetails] = useState<WorkDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && recordId) {
      fetchWorkDetails(recordId, appointmentType);
    }
  }, [isOpen, recordId, appointmentType]);

  const fetchWorkDetails = async (id: string, type?: string) => {
    setLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");

      let endpoint = "";
      let data = null;

      // Special handling for EarthWork - need to find record with matching testRecordId
      if (type === "EARTHWORK") {
        const listResponse = await fetch("http://192.168.4.150:8080/api/v1/CEarthWork", {
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!listResponse.ok) {
          throw new Error(`Failed to fetch EarthWork list: ${listResponse.status}`);
        }

        const listData = await listResponse.json();
        
        // Find the record with matching testRecordId
        let earthWorkRecord = null;
        if (listData?.list && Array.isArray(listData.list)) {
          earthWorkRecord = listData.list.find((item: any) => item.testRecordId === id);
        }

        if (!earthWorkRecord) {
          throw new Error(`EarthWork record with testRecordId ${id} not found`);
        }

        // Now use the actual record's id for the detailed fetch
        const earthWorkId = earthWorkRecord.id;
        
        const detailResponse = await fetch(
          `http://192.168.4.150:8080/api/v1/CEarthWork/${earthWorkId}`,
          {
            headers: {
              Authorization: `Basic ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!detailResponse.ok) {
          throw new Error(`Failed to fetch EarthWork details: ${detailResponse.status}`);
        }

        data = await detailResponse.json();
        
        // Map CEarthWork specific fields
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxi || data.perioxitext || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : ""),
          sr: data.sr || data.srText || id,
          status: data.status || "Προγραμματισμένο",
          difficulty: data.difficultyLevel || "Μέτριο",
          difficultyValue: data.difficultyValue || "(1.5)",
          jobType: data.category || "FTTH Retail",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "3",
          priority: data.priority || "5",
          requiredTechnicians: data.requiredTechnicians || "3",
          channels: data.kagkela === "ΝΑΙ" || data.channels === "ΝΑΙ" || false,
          excavation: data.mikosChwma > 0 || data.excavation === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || data.conduit === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || data.ftu === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || data.usage === "ΝΑΙ" || false,
          bmo: data.bmo || "LARGE",
          bcp: data.bcp === "ΝΑΙ" || data.hasBCP === "ΝΑΙ" || false,
          description: data.description || data.customerName || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "ΚΑΤ Α",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "2025-03-17",
          timeSlot: data.dateStart && data.dateEnd 
            ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}`
            : "12:00 - 15:30",
          latitude: parseFloat(data.lat || data.addressLatitude || data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 37.9838,
          longitude: parseFloat(data.long || data.addressLongitude || data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 23.7275,
        });
        return;
      } 
      // Handle AUTOPSY type (Test)
      else if (type === "AUTOPSY") {
        endpoint = `http://192.168.4.150:8080/api/v1/Test/${id}`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Test details: ${response.status}`);
        }

        data = await response.json();
        
        // Map Test specific fields
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.clientAddress || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxitext || data.dimos || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : ""),
          sr: data.sr || data.srText || data.tobbsrid || id,
          status: data.status || data.fieldstatus || "Προγραμματισμένο",
          difficulty: data.difficulty || "Μέτριο",
          difficultyValue: data.dyskolia ? `(${data.dyskolia})` : "(1.5)",
          jobType: data.category || "FTTH Retail",
          estimatedHours: "3",
          priority: data.priority || "5",
          requiredTechnicians: "3",
          channels: data.kagkela === "ΝΑΙ" || false,
          excavation: data.excavation === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || data.conduit === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || "LARGE",
          bcp: data.bcp === "ΝΑΙ" || data.existingbcp === "ΝΑΙ" || data.needBCP === "ΝΑΙ" || false,
          description: data.description || data.clientName || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "Autopsy",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "2025-03-17",
          timeSlot: "12:00 - 15:30",
          latitude: parseFloat(data.lat || data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 37.9838,
          longitude: parseFloat(data.long || data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 23.7275,
        });
        return;
      }
      // Handle CONSTRUCTION type
      else if (type === "CONSTRUCTION") {
        endpoint = `http://192.168.4.150:8080/api/v1/CKataskeyastikadates/${id}`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Construction details: ${response.status}`);
        }

        data = await response.json();
        
        // Map Construction specific fields
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.addressfront || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxi || data.perioxitext || data.dimos || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : ""),
          sr: data.sr || data.srText || id,
          status: data.status || "Προγραμματισμένο",
          difficulty: data.difficultLevel || data.dyskoliakat || "Μέτριο",
          difficultyValue: "(1.5)",
          jobType: data.category || "FTTH Retail",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "3",
          priority: "5",
          requiredTechnicians: "3",
          channels: data.kagkela === "ΝΑΙ" || false,
          excavation: data.earthWork === "ΝΑΙ" || data.chwma === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || data.tobbbmotype || "LARGE",
          bcp: data.bcp === "ΝΑΙ" || data.needBCP === "ΝΑΙ" || false,
          description: data.description || data.customerName || data.adminname || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "Technicians - Construct",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "2025-03-17",
          timeSlot: data.dateStart && data.dateEnd 
            ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` 
            : "12:00 - 15:30",
          latitude: parseFloat(data.addressLatitude || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 37.9838,
          longitude: parseFloat(data.addressLongitude || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 23.7275,
        });
        return;
      }
      // Handle SPLICING type
      else if (type === "SPLICING") {
        endpoint = `http://192.168.4.150:8080/api/v1/CSplicingWork/${id}`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch Splicing details: ${response.status}`);
        }

        data = await response.json();
        
        // Map Splicing specific fields
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxi || data.perioxitext || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : ""),
          sr: data.sr || data.srText || id,
          status: data.status || "Προγραμματισμένο",
          difficulty: "Μέτριο",
          difficultyValue: "(1.5)",
          jobType: data.category || "FTTH Retail",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "3",
          priority: "5",
          requiredTechnicians: "3",
          channels: data.kagkela === "ΝΑΙ" || data.enaeria === "ΝΑΙ" || false,
          excavation: data.chwma === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || data.tobbbmotype || "LARGE",
          bcp: data.bcp === "ΝΑΙ" || false,
          description: data.description || data.info || data.infoHtml || data.customerName || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "Technicians - Splicers",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "2025-03-17",
          timeSlot: data.dateStart && data.dateEnd 
            ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` 
            : "12:00 - 15:30",
          latitude: parseFloat(data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 37.9838,
          longitude: parseFloat(data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 23.7275,
        });
        return;
      }
      // Default handler for other types
      else {
        endpoint = `http://192.168.4.150:8080/api/v1/Test/${id}`;
        
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch details: ${response.status}`);
        }

        data = await response.json();
        
        // Default mapping
        setWorkDetails({
          id: data.id || id,
          title: data.name || "ΠΑΝΟΣ 33",
          address: data.address || data.addressStreet || data.clientAddress || data.name?.split(" Δ. ")[0] || "ΠΑΝΟΣ 33",
          area: data.area || data.addressCity || data.perioxi || data.perioxitext || data.dimos || "Δ. ΓΑΛΑΤΣΙΟΥ",
          sr: data.sr || data.srText || "2-327163805248",
          status: data.status || "Προγραμματισμένο",
          difficulty: data.difficulty || data.difficultyLevel || "Μέτριο",
          difficultyValue: data.difficultyValue || "(1.5)",
          jobType: data.jobType || data.category || "FTTH Retail",
          estimatedHours: data.estimatedHours || "3",
          priority: data.priority || "5",
          requiredTechnicians: data.requiredTechnicians || "3",
          channels: data.channels === "true" || data.channels === true || data.kagkela === "ΝΑΙ" || true,
          excavation: data.excavation === "true" || data.excavation === true || data.chwma === "ΝΑΙ" || false,
          conduit: data.conduit === "true" || data.conduit === true || data.kanali === "ΝΑΙ" || false,
          ftu: data.ftu === "true" || data.ftu === true || data.kya === "ΝΑΙ" || true,
          usage: data.usage === "true" || data.usage === true || data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || "LARGE",
          bcp: data.bcp === "true" || data.bcp === true || data.hasBCP === "ΝΑΙ" || false,
          description: data.description || data.sxolia || "ΣΟΦΙΑ ΓΟΥΡΝΑ - 2-327163805248",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "ΚΑΤ Α",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "2025-03-17",
          timeSlot: data.dateStart && data.dateEnd 
            ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` 
            : "12:00 - 15:30",
          latitude: parseFloat(data.addressLatitude || data.lat || data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 37.9838,
          longitude: parseFloat(data.addressLongitude || data.long || data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 23.7275,
        });
      }
    } catch (error) {
      console.error("Error fetching work details:", error);
      setError("Failed to load work details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-aspro rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="text-blue-600 mr-2">
              <MapPin size={20} />
            </span>
            {GREEK_TRANSLATIONS.labels.workDetails}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent mx-auto mb-4"></div>
            <p>Φόρτωση λεπτομερειών...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : workDetails ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium mb-3">{workDetails.title}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">SR</div>
                    <div className="font-medium">{workDetails.sr}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Περιοχή</div>
                    <div className="font-medium">{workDetails.area}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Δυσκολία</div>
                  <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                    {workDetails.difficulty} {workDetails.difficultyValue}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Κατάσταση</div>
                  <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                    {workDetails.status}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Στοιχεία Εργασίας</h4>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Τύπος Εργασίας:</div>
                    <div>{workDetails.jobType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Εκτιμώμενες Ώρες:</div>
                    <div>{workDetails.estimatedHours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Προτεραιότητα:</div>
                    <div>{workDetails.priority}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Απαιτούμενοι Τεχνικοί:</div>
                    <div>{workDetails.requiredTechnicians}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-3">Τεχνικές Προδιαγραφές</h4>
                <div className="grid grid-cols-4 gap-y-3">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Κανάλια</div>
                    <div className={workDetails.channels ? "font-medium" : "text-gray-400"}>
                      {workDetails.channels ? "ΝΑΙ" : "ΟΧΙ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Εκσκαφή</div>
                    <div className={workDetails.excavation ? "font-medium" : "text-gray-400"}>
                      {workDetails.excavation ? "ΝΑΙ" : "ΟΧΙ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Κανάλι</div>
                    <div className={workDetails.conduit ? "font-medium" : "text-gray-400"}>
                      {workDetails.conduit ? "ΝΑΙ" : "ΟΧΙ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">KYA</div>
                    <div className={workDetails.ftu ? "font-medium" : "text-gray-400"}>
                      {workDetails.ftu ? "ΝΑΙ" : "ΟΧΙ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Χρήση</div>
                    <div className={workDetails.usage ? "font-medium" : "text-gray-400"}>
                      {workDetails.usage ? "ΝΑΙ" : "ΟΧΙ"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">BMO</div>
                    <div className="font-medium">{workDetails.bmo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">BCP</div>
                    <div className={workDetails.bcp ? "font-medium" : "text-gray-400"}>
                      {workDetails.bcp ? "ΝΑΙ" : "ΟΧΙ"}
                    </div>
                  </div>
                </div>
              </div>

              {workDetails.description && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Περιγραφή</h4>
                  <div className="border p-3 rounded-md bg-gray-50">
                    {workDetails.description}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Map */}
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden border">
                <div className="relative h-full">
                  <div className="absolute inset-0">
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <p className="text-gray-700 font-medium">{workDetails.address}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {workDetails.latitude.toFixed(6)}, {workDetails.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex space-x-1">
                      <button className="w-8 h-8 flex items-center justify-center bg-aspro rounded-md shadow text-gray-700">
                        +
                      </button>
                      <button className="w-8 h-8 flex items-center justify-center bg-aspro rounded-md shadow text-gray-700">
                        −
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Προγραμματισμός</h4>
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="text-blue-500 w-5 h-5 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">Ομάδα:</div>
                      <div className="font-medium">{workDetails.team}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="text-blue-500 w-5 h-5 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">Ημ/νία:</div>
                      <div className="font-medium">{workDetails.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="text-blue-500 w-5 h-5 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">Ώρα:</div>
                      <div className="font-medium">{workDetails.timeSlot}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No details available</div>
        )}

        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {GREEK_TRANSLATIONS.buttons.close}
          </button>
        </div>
      </div>
    </div>
  );
};

const EventCalendar: React.FC = () => {
  // Define appointment type labels and constants
  const APPOINTMENT_TYPE_LABELS = {
    AUTOPSY: "Αυτοψίες",
    CONSTRUCTION: "Κατασκευές",
    SPLICING: "Κολλήσεις",
    EARTHWORK: "Χωματουργικά",
  };
  
  // Define the appointment type order
  const APPOINTMENT_TYPE_ORDER: AppointmentType[] = ['AUTOPSY', 'CONSTRUCTION', 'SPLICING', 'EARTHWORK'];
  
  // Mapping team names to appointment types
  const TEAM_TO_APPOINTMENT_TYPE: Record<string, AppointmentType> = {
    'Autopsy': 'AUTOPSY',
    'Technicians - Construct': 'CONSTRUCTION',
    'Technicians - Splicers': 'SPLICING',
    'Technicians - Soil': 'EARTHWORK',
  };
  
  // Background colors for job modal sections
  const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
    AUTOPSY: "bg-purple-50",
    CONSTRUCTION: "bg-green-50",
    SPLICING: "bg-blue-50",
    EARTHWORK: "bg-orange-50",
  };
  
  // Greek translations for team names
  const TEAM_NAME_TRANSLATIONS: Record<string, string> = {
    "Technicians - Construct": "Κατασκευαστής",
    "Technicians - Splicers": "Τεχνικός Κολλήσεων",
    "Technicians - Soil": "Χωματουργός",
    "Autopsy": "Τεχνικός Αυτοψίας",
  };
  
  // Helper function to translate team names
  const translateTeamName = (team: string): string => {
    return TEAM_NAME_TRANSLATIONS[team] || team;
  };

  // State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [view, setView] = useState<CalendarView>(CalendarView.Month);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTechnicianModalOpen, setIsTechnicianModalOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [viewingAllTechnicians, setViewingAllTechnicians] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState<boolean>(false);
  
  // New state for day events modal
  const [isDayEventsModalOpen, setIsDayEventsModalOpen] = useState<boolean>(false);
  
  // New state for work details modal
  const [isWorkDetailsOpen, setIsWorkDetailsOpen] = useState<boolean>(false);
  const [selectedWorkId, setSelectedWorkId] = useState<string>("");
  const [selectedWorkType, setSelectedWorkType] = useState<string>("");
  
  // Filter states
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<Record<AppointmentType, boolean>>({
    AUTOPSY: true,
    CONSTRUCTION: true,
    SPLICING: true,
    EARTHWORK: true
  });
  
  // State for technician filters
  const [activeTechnicianFilters, setActiveTechnicianFilters] = useState<Record<string, boolean>>({});

  // Handle technician filter changes
  const handleTechnicianFilterChange = (newFilters: Record<string, boolean>) => {
    setActiveTechnicianFilters(newFilters);
  };
  
  // Filtered events based on type and technician filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Check appointment type filter
      const typeIsActive = !event.appointmentType || activeFilters[event.appointmentType];
      
      // Check technician filter
      const technicianForEvent = technicians.find(tech => tech.name === event.technicianName);
      const technicianIsActive = !technicianForEvent?.id || activeTechnicianFilters[technicianForEvent.id];
      
      return typeIsActive && technicianIsActive;
    });
  }, [events, activeFilters, activeTechnicianFilters, technicians]);
  
  // API request state
  const fetchEventsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Fetch technicians from API
  const fetchTechnicians = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");

      const response = await fetch("http://192.168.4.150:8080/api/v1/User", {
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch technicians: ${response.status}`);

      const data = await response.json();
      
      const detailedTechnicians = await Promise.allSettled(
        data.list.map(async (user: any) => {
          try {
            const detailResponse = await fetch(
              `http://192.168.4.150:8080/api/v1/User/${user.id}`,
              {
                headers: {
                  Authorization: `Basic ${authToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!detailResponse.ok) return null;

            const userDetail = await detailResponse.json();
            
            // Get team information and normalize it
            const teams = Object.values(userDetail.teamsNames || {}) as string[];
            const normalizedTeams = teams.map(team => 
              typeof team === 'string' ? team.replace(/\s+/g, ' ').trim().toLowerCase() : ''
            );
            
            // Define exact mapping of API teams to normalize potential variations
            const teamMappings: Record<string, string> = {
              'technicians - construct': 'Technicians - Construct',
              'technicians - splicers': 'Technicians - Splicers',
              'technicians - soil': 'Technicians - Soil',
              'autopsy': 'Autopsy'
            };
            
            // Find the first matching team from our expected teams
            let matchedTeam = null;
            for (const normalizedTeam of normalizedTeams) {
              if (teamMappings[normalizedTeam]) {
                matchedTeam = teamMappings[normalizedTeam];
                break;
              }
            }
            
            if (!matchedTeam) return null;

            return {
              id: user.id,
              name: user.name,
              team: matchedTeam
            };
          } catch (error) {
            return null;
          }
        })
      );

      const filteredTechnicians = (detailedTechnicians as PromiseSettledResult<Technician | null>[])
        .filter((result): result is PromiseFulfilledResult<Technician> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
      
      setTechnicians(filteredTechnicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      setError("Failed to load technicians. Please try again.");
    }
    setLoading(false);
  }, []);

  // Fetch events from API
  const fetchEvents = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");
      
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      
      // Fetch events from all endpoints
      const allEvents: Event[] = [];
      
      await Promise.all(CONSTRUCTION_API_ENDPOINTS.map(async (endpoint) => {
        const apiSource = endpoint.split('/').pop() || 'Unknown';
        
        try {
          const response = await fetch(`${endpoint}?date=${formattedDate}`, {
            headers: {
              Authorization: `Basic ${authToken}`,
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) throw new Error(`Failed to fetch from ${endpoint}: ${response.status}`);
          
          const data = await response.json();
          
          if (data?.list && Array.isArray(data.list)) {
            data.list.forEach((item: any) => {
              if (item.dateStart && item.assignedUserName) {
                // Map API data to Event type
                const appointmentType = getAppointmentTypeFromEndpoint(apiSource);
                
                // Add event with location data when available
                allEvents.push({
                  id: item.id || String(Math.random()),
                  name: item.name || apiSource,
                  start: new Date(item.dateStart),
                  end: new Date(item.dateEnd || addHours(new Date(item.dateStart), 1)),
                  technicianName: item.assignedUserName,
                  technicianId: item.assignedUser,
                  status: item.status,
                  sr: apiSource === 'Test' ? item.srText : item.sr,
                  testRecordId: item.testRecordId,
                  area: item.addressCity || item.perioxi || (item.name?.includes(" Δ. ") ? "Δ. " + item.name.split(" Δ. ")[1] : ""),
                  details: item.details || item.description || item.info || item.sxolia,
                  appointmentType,
                  location: (item.addressLatitude && item.addressLongitude) || item.mapsurl ? {
                    latitude: parseFloat(item.addressLatitude || (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[0] : "0")),
                    longitude: parseFloat(item.addressLongitude || (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[1] : "0")),
                    address: item.addressStreet || item.address || item.name || ""
                  } : undefined
                });
              }
            });
          }
        } catch (error) {
          console.error(`Error fetching from ${endpoint}:`, error);
        }
      }));
      
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again.");
    }
    setLoading(false);
  }, [currentDate]);

  // Helper function to get appointment type from endpoint
  const getAppointmentTypeFromEndpoint = (endpoint: string): AppointmentType => {
    switch (endpoint) {
      case 'CKataskeyastikadates':
        return 'CONSTRUCTION';
      case 'CSplicingWork':
        return 'SPLICING';
      case 'CEarthWork':
        return 'EARTHWORK';
      case 'Test':
        return 'AUTOPSY';
      default:
        return 'CONSTRUCTION';
    }
  };

  // Helper function to add hours to a date
  const addHours = (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  };

  // Navigate to previous period (month/week)
  const goToPrevious = () => {
    if (view === CalendarView.Month) {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === CalendarView.Week) {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  // Navigate to next period (month/week)
  const goToNext = () => {
    if (view === CalendarView.Month) {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === CalendarView.Week) {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };
  
  // Get technicians with events on a specific date
  const getTechniciansForDate = (date: Date): Technician[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // Important: Use the full events array, not filteredEvents, to get ALL technicians
    // with events on this date regardless of filter settings
    const dateEvents = events.filter(event => format(new Date(event.start), 'yyyy-MM-dd') === dateKey);
    
    // Get unique technician names from events
    const techNames = [...new Set(dateEvents.map(event => event.technicianName))];
    
    // Get all technicians who have events on this date
    return technicians.filter(tech => techNames.includes(tech.name));
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date): Event[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    
    // Start with all events on this date
    return filteredEvents.filter(event => 
      format(new Date(event.start), 'yyyy-MM-dd') === dateKey
    );
  };

  // Handle day click - UPDATED to show events directly
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayEventsModalOpen(true);
  };

  // Handle event click from any view
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  // Handle event edit
  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  // Handle save edited event
  const handleSaveEvent = async (updatedEvent: Event) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");
      
      // In a real application, you would send the update to the API here
      // For now, we'll just update the local state
      
      // Update events state
      setEvents(prevEvents => 
        prevEvents.map(e => e.id === updatedEvent.id ? updatedEvent : e)
      );
      
      setIsEditModalOpen(false);
      // Refresh events to get updated data
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      setError("Failed to save event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle view details - UPDATED to open the WorkDetailsModal
  const handleViewDetails = async (testRecordId: string, appointmentType?: string): Promise<void> => {
    if (!testRecordId) {
      alert('No test record ID available for this event.');
      return;
    }
  
    try {
      // Set the work details to be shown in the modal
      setSelectedWorkId(testRecordId);
      setSelectedWorkType(appointmentType || '');
      setIsWorkDetailsOpen(true);
      
      // Close the event detail modal if it's open
      setIsEventDetailOpen(false);
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
      alert('Error loading details. Please try again.');
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Record<AppointmentType, boolean>) => {
    setActiveFilters(newFilters);
  };

  // Handle technician selection
  const handleSelectTechnician = (technicianId: string) => {
    const technician = technicians.find(tech => tech.id === technicianId) || null;
    setSelectedTechnician(technician);
    setViewingAllTechnicians(false);
    setIsTechnicianModalOpen(false);
    setIsScheduleModalOpen(true);
  };

  // Handle view all schedules
  const handleViewAllSchedules = () => {
    setSelectedTechnician(null);
    setViewingAllTechnicians(true);
    setIsTechnicianModalOpen(false);
    setIsScheduleModalOpen(true);
  };

  // Render title based on view
  const renderTitle = () => {
    if (view === CalendarView.Month) {
      return `${GREEK_TRANSLATIONS.months[getMonth(currentDate)]} ${getYear(currentDate)}`;
    } else {
      const weekNumber = getWeek(currentDate);
      return `${GREEK_TRANSLATIONS.view.week} ${weekNumber}, ${getYear(currentDate)}`;
    }
  };

  // Initialize technician filters when technicians are loaded
  useEffect(() => {
    if (technicians.length > 0) {
      // Initialize with all technicians active
      const initialTechnicianFilters = technicians.reduce((acc, tech) => {
        acc[tech.id] = true;
        return acc;
      }, {} as Record<string, boolean>);
      
      setActiveTechnicianFilters(initialTechnicianFilters);
    }
  }, [technicians]);

  // Initial data load
  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  // Load events when date changes
  useEffect(() => {
    if (fetchEventsTimeout.current) {
      clearTimeout(fetchEventsTimeout.current);
    }
    
    fetchEventsTimeout.current = setTimeout(() => {
      fetchEvents();
    }, 300);
    
    return () => {
      if (fetchEventsTimeout.current) {
        clearTimeout(fetchEventsTimeout.current);
      }
    };
  }, [currentDate, fetchEvents]);

  // Get active filter count for badge
  const activeFilterCount = useMemo(() => {
    const appointmentTypeFilterCount = Object.values(activeFilters).filter(v => !v).length;
    const technicianFilterCount = Object.values(activeTechnicianFilters).filter(v => !v).length;
    return appointmentTypeFilterCount + technicianFilterCount;
  }, [activeFilters, activeTechnicianFilters]);

  // Loading component
  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">{GREEK_TRANSLATIONS.buttons.loading}</p>
        </div>
      </div>
    );
  }

  // Render calendar
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-aspro border-b shadow-sm py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{GREEK_TRANSLATIONS.labels.eventSchedule}</h1>
        
        {/* View buttons */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-lg flex items-center ${view === CalendarView.Week ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setView(CalendarView.Week)}
            >
              <Calendar size={16} className="mr-1" />
              {GREEK_TRANSLATIONS.view.week}
            </button>
            <button 
              className={`px-3 py-1 rounded-lg flex items-center ${view === CalendarView.Month ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setView(CalendarView.Month)}
            >
              <Calendar size={16} className="mr-1" />
              {GREEK_TRANSLATIONS.view.month}
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button 
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg flex items-center text-gray-700 relative"
              onClick={() => setIsFilterPanelOpen(true)}
            >
              <Filter size={16} className="mr-1" />
              Φίλτρα
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button 
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center text-white"
              onClick={() => setIsMapModalOpen(true)}
            >
              <MapPin size={16} className="mr-1" />
              {GREEK_TRANSLATIONS.buttons.mapView}
            </button>
          </div>
        </div>
      </header>
      
      {/* Title and navigation */}
      <div className="px-6 py-4 bg-aspro border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{renderTitle()}</h2>
          
          <div className="flex items-center">
            {/* Filter indicators */}
            <div className="flex flex-wrap space-x-2 mr-4 max-w-sm justify-end">
              {Object.entries(activeFilters).map(([type, isActive]) => !isActive && (
                <span key={`type-${type}`} className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700 flex items-center mb-1">
                  <X size={12} className="mr-1" /> 
                  {APPOINTMENT_TYPE_LABELS[type as AppointmentType]}
                </span>
              ))}
              
              {/* We only show filtered-out technicians if there aren't too many */}
              {Object.entries(activeTechnicianFilters)
                .filter(([_, isActive]) => !isActive)
                .slice(0, 3)
                .map(([techId, _]) => {
                  const tech = technicians.find(t => t.id === techId);
                  return tech ? (
                    <span key={`tech-${techId}`} className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700 flex items-center mb-1">
                      <X size={12} className="mr-1" /> {tech.name}
                    </span>
                  ) : null;
                })
              }
              
              {/* Add a "+X more" indicator if there are more filtered technicians */}
              {Object.entries(activeTechnicianFilters).filter(([_, isActive]) => !isActive).length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700 flex items-center mb-1">
                  +{Object.entries(activeTechnicianFilters).filter(([_, isActive]) => !isActive).length - 3} περισσότερα
                </span>
              )}
            </div>
            
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mr-2"
              onClick={goToPrevious}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100"
              onClick={goToNext}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 m-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
          <button 
            onClick={fetchEvents} 
            className="mt-2 text-sm underline"
          >
            Δοκιμάστε ξανά
          </button>
        </div>
      )}
      
      {/* Calendar View */}
      <div className="flex-1 p-6">
        {view === CalendarView.Month ? (
          <MonthView 
            currentDate={currentDate}
            events={filteredEvents}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        ) : (
          <WeekView 
            currentDate={currentDate}
            events={filteredEvents}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </div>
      
      {/* Modals and Panels */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        activeFilters={activeFilters}
        activeTechnicianFilters={activeTechnicianFilters}
        onFilterChange={handleFilterChange}
        onTechnicianFilterChange={handleTechnicianFilterChange}
        technicians={technicians}
      />
      
      <TechnicianModal 
        isOpen={isTechnicianModalOpen}
        onClose={() => setIsTechnicianModalOpen(false)}
        date={selectedDate}
        technicians={selectedDate ? getTechniciansForDate(selectedDate) : []}
        onSelectTechnician={handleSelectTechnician}
        onViewAll={handleViewAllSchedules}
        activeTeamFilters={{}} // This should be updated if TechnicianModal requires it
      />
      
      <ScheduleModal 
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        date={selectedDate}
        events={selectedDate 
          ? filteredEvents.filter(event => 
              format(new Date(event.start), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
              (!selectedTechnician || event.technicianName === selectedTechnician.name)
            )
          : []
        }
        technician={selectedTechnician}
        isAllTechnicians={viewingAllTechnicians}
        onEdit={handleEditEvent}
        onViewDetails={handleViewDetails}
        onEventClick={handleEventClick}
      />

      <MapViewModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        events={filteredEvents}
        onEventClick={handleEventClick}
        onViewDetails={handleViewDetails}
      />

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent}
          isOpen={isEventDetailOpen}
          onClose={() => setIsEventDetailOpen(false)}
          onViewDetails={handleViewDetails}
          onEdit={handleEditEvent}
          technicianName={selectedEvent.technicianName}
        />
      )}
      
      {/* Day Events Modal */}
      <DayEventsModal
        isOpen={isDayEventsModalOpen}
        onClose={() => setIsDayEventsModalOpen(false)}
        date={selectedDate}
        events={selectedDate ? getEventsForDate(selectedDate) : []}
        onEventClick={handleEventClick}
      />
      
      {/* Work Details Modal */}
      <WorkDetailsModal
        isOpen={isWorkDetailsOpen}
        onClose={() => setIsWorkDetailsOpen(false)}
        recordId={selectedWorkId}
        appointmentType={selectedWorkType}
      />
    </div>
  );
};

export default EventCalendar;