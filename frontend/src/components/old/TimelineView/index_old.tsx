"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  ChevronDown, ChevronUp, ChevronRight, ChevronLeft, X, Calendar as CalendarIcon, 
  Plus, Check, Edit, Trash, User, Users, Clock, Loader, ArrowUpDown,
  Filter, AlertCircle, LocateFixed, RefreshCw, MapPin, Sliders
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
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
  addHours,
  parseISO,
} from 'date-fns';
import { motion, AnimatePresence } from "framer-motion";

// Define AppointmentType as enum for better type checking
enum AppointmentTypeEnum {
  CONSTRUCTION = 'CONSTRUCTION',
  SPLICING = 'SPLICING',
  EARTHWORK = 'EARTHWORK',
  AUTOPSY = 'AUTOPSY'
}

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

interface WorkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  appointmentType?: string;
}

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  technicianName?: string;
  onViewDetails: (testRecordId: string, appointmentType?: string) => Promise<void>;
  onEdit?: (event: Event) => void;
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
const EVENT_STYLES = {
  'ΟΛΟΚΛΗΡΩΣΗ': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'ΑΠΟΣΤΟΛΗ': 'bg-blue-50 border-blue-200 text-blue-700',
  'ΑΠΟΡΡΙΨΗ': 'bg-yellow-50 border-yellow-200 text-yellow-700',
  'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': 'bg-red-50 border-red-200 text-red-700',
  'default': 'bg-gray-50 border-gray-200 text-gray-700'
};

// Event style mapping for the timeline view
const TIMELINE_EVENT_STYLES = {
  'CONSTRUCTION': 'bg-green-900 text-white',
  'SPLICING': 'bg-blue-900 text-white',
  'EARTHWORK': 'bg-orange-800 text-white',
  'AUTOPSY': 'bg-purple-900 text-white',
  'default': 'bg-gray-700 text-white'
};

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('.')
    .toUpperCase();
};

// Helper function to generate color from string
const stringToColor = (str: string) => {
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
const InitialsAvatar = ({ name, className = "" }) => {
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


// Get Event Style Function for Timeline
const getTimelineEventStyle = (appointmentType: any) => {
  return TIMELINE_EVENT_STYLES[appointmentType || 'default'] || TIMELINE_EVENT_STYLES.default;
};

// Function to get status class
const getEventStyle = (status) => {
  return EVENT_STYLES[status || 'default'] || EVENT_STYLES.default;
};

// Event Map Component
const EventMap = ({ location }) => {
  const mapContainer = useRef(null);
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

// Filter Panel Component with team filters
const FilterPanel = ({
  isOpen,
  onClose,
  activeFilters,
  activeTeamFilters,
  activeTechnicianFilters,
  onFilterChange,
  onTeamFilterChange,
  onTechnicianFilterChange,
  technicians
}) => {
  // Use refs to store the previous values to avoid unnecessary state updates
  const prevIsOpenRef = useRef(isOpen);
  const prevActiveFiltersRef = useRef(activeFilters);
  const prevActiveTeamFiltersRef = useRef(activeTeamFilters);
  const prevActiveTechnicianFiltersRef = useRef(activeTechnicianFilters);
  
  const [tempFilters, setTempFilters] = useState(activeFilters);
  const [tempTeamFilters, setTempTeamFilters] = useState(activeTeamFilters);
  const [tempTechnicianFilters, setTempTechnicianFilters] = useState(activeTechnicianFilters);
  
  // For technician dropdown
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  
  // Get unique teams from technicians
  const uniqueTeams = useMemo(() => {
    const teams = new Set();
    technicians.forEach(tech => {
      if (tech.team) teams.add(tech.team);
    });
    return Array.from(teams).sort();
  }, [technicians]);
  
  // Fixed useEffect to prevent infinite loops
  useEffect(() => {
    // Only update temp filters when isOpen changes from false to true (modal opening)
    // or when filters change while modal is already open
    if (
      (isOpen && !prevIsOpenRef.current) || 
      (isOpen && JSON.stringify(activeFilters) !== JSON.stringify(prevActiveFiltersRef.current)) ||
      (isOpen && JSON.stringify(activeTeamFilters) !== JSON.stringify(prevActiveTeamFiltersRef.current)) ||
      (isOpen && JSON.stringify(activeTechnicianFilters) !== JSON.stringify(prevActiveTechnicianFiltersRef.current))
    ) {
      setTempFilters({...activeFilters});
      setTempTeamFilters({...activeTeamFilters});
      setTempTechnicianFilters({...activeTechnicianFilters});
      
      // Update refs to new values
      prevActiveFiltersRef.current = activeFilters;
      prevActiveTeamFiltersRef.current = activeTeamFilters;
      prevActiveTechnicianFiltersRef.current = activeTechnicianFilters;
    }
    
    // Update isOpen ref
    prevIsOpenRef.current = isOpen;
  }, [isOpen, activeFilters, activeTeamFilters, activeTechnicianFilters]);
  
  const handleFilterToggle = (type) => {
    setTempFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  const handleTeamFilterToggle = (team) => {
    setTempTeamFilters(prev => ({
      ...prev,
      [team]: !prev[team]
    }));
  };
  
  const handleTechnicianFilterToggle = (techId) => {
    setTempTechnicianFilters(prev => ({
      ...prev,
      [techId]: !prev[techId]
    }));
  };
  
  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    onTeamFilterChange(tempTeamFilters);
    onTechnicianFilterChange(tempTechnicianFilters);
    onClose();
  };
  
  const handleSelectAllTypes = () => {
    setTempFilters(Object.keys(tempFilters).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {}));
  };
  
  const handleSelectNoneTypes = () => {
    setTempFilters(Object.keys(tempFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {}));
  };
  
  const handleSelectAllTeams = () => {
    setTempTeamFilters(uniqueTeams.reduce((acc, team) => {
      acc[team] = true;
      return acc;
    }, {}));
  };
  
  const handleSelectNoneTeams = () => {
    setTempTeamFilters(uniqueTeams.reduce((acc, team) => {
      acc[team] = false;
      return acc;
    }, {}));
  };
  
  const handleSelectAllTechnicians = () => {
    setTempTechnicianFilters(technicians.reduce((acc, tech) => {
      acc[tech.id] = true;
      return acc;
    }, {}));
  };
  
  const handleSelectNoneTechnicians = () => {
    setTempTechnicianFilters(technicians.reduce((acc, tech) => {
      acc[tech.id] = false;
      return acc;
    }, {}));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-30">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-aspro text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
          <div className="flex justify-between items-center px-4 py-3 border-b">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Sliders className="w-5 h-5 mr-2 text-gray-500" />
              Φίλτρα ημερολογίου
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="bg-aspro px-4 py-3 max-h-[80vh] overflow-y-auto">
            {/* Appointment Type Filters */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-md font-medium text-gray-700">
                  Τύποι Ραντεβού
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectAllTypes}
                  >
                    Επιλογή όλων
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
                <div 
                  className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                  onClick={() => handleFilterToggle('CONSTRUCTION')}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempFilters.CONSTRUCTION ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {tempFilters.CONSTRUCTION && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-green-700 font-medium">Κατασκευές</span>
                </div>
                
                <div 
                  className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                  onClick={() => handleFilterToggle('SPLICING')}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempFilters.SPLICING ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {tempFilters.SPLICING && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-blue-700 font-medium">Κολλήσεις</span>
                </div>
                
                <div 
                  className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                  onClick={() => handleFilterToggle('EARTHWORK')}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempFilters.EARTHWORK ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {tempFilters.EARTHWORK && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-orange-700 font-medium">Χωματουργικά</span>
                </div>
                
                <div 
                  className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                  onClick={() => handleFilterToggle('AUTOPSY')}
                >
                  <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempFilters.AUTOPSY ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {tempFilters.AUTOPSY && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <span className="text-purple-700 font-medium">Αυτοψίες</span>
                </div>
              </div>
            </div>
            
            {/* Team Filters */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-md font-medium text-gray-700">
                  Ομάδες Τεχνικών
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectAllTeams}
                  >
                    Επιλογή όλων
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectNoneTeams}
                  >
                    Κανένα
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {uniqueTeams.map(team => (
                  <div 
                    key={team}
                    className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                    onClick={() => handleTeamFilterToggle(team)}
                  >
                    <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempTeamFilters[team] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {tempTeamFilters[team] && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-medium">{team}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Technicians Filter Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-md font-medium text-gray-700">
                  Τεχνικοί
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectAllTechnicians}
                  >
                    Επιλογή όλων
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={handleSelectNoneTechnicians}
                  >
                    Κανένα
                  </button>
                </div>
              </div>
              
              {/* Dropdown controller */}
              <div 
                className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between mb-2"
                onClick={() => setIsTechDropdownOpen(!isTechDropdownOpen)}
              >
                <span className="font-medium">Επιλεγμένοι Τεχνικοί: {Object.values(tempTechnicianFilters).filter(Boolean).length} από {technicians.length}</span>
                <div className="flex items-center">
                  {isTechDropdownOpen ? 
                    <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  }
                </div>
              </div>
              
              {/* Technicians List - Collapsible */}
              {isTechDropdownOpen && (
                <div className="space-y-2 max-h-60 overflow-y-auto bg-aspro rounded-md border p-2">
                  {technicians.map(tech => (
                    <div 
                      key={tech.id}
                      className="px-3 py-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 flex items-center"
                      onClick={() => handleTechnicianFilterToggle(tech.id)}
                    >
                      <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempTechnicianFilters[tech.id] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {tempTechnicianFilters[tech.id] && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <div className="font-medium">{tech.name}</div>
                        <div className="text-xs text-gray-500">{tech.team}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

// Event Detail Modal
const EventDetailModal = ({ 
  isOpen, 
  onClose, 
  event, 
  technicianName, 
  onViewDetails, 
  onEdit 
}) => {
  if (!isOpen || !event) return null;
  
  const formattedDate = format(new Date(event.start), 'dd/MM/yyyy');
  const formattedStartTime = format(new Date(event.start), 'HH:mm');
  const formattedEndTime = format(new Date(event.end), 'HH:mm');

  const handleViewDetails = () => {
    if (event.testRecordId || event.id) {
      onViewDetails(
        event.appointmentType === 'AUTOPSY' ? event.id : (event.testRecordId || event.id),
        event.appointmentType
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>
        
        <div className="relative transform overflow-hidden rounded-lg bg-aspro text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {technicianName || event.technicianName}'s Schedule for {format(new Date(event.start), 'MMMM d, yyyy')}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {/* Event Card */}
            <div className="bg-aspro border border-green-100 rounded-lg p-5 shadow-sm">
              <div className="flex justify-between items-start">
                <h4 className="text-xl font-medium text-green-700">
                  {event.name}
                </h4>
                {onEdit && (
                  <Edit 
                    className="h-5 w-5 text-blue-500 cursor-pointer" 
                    onClick={() => {
                      onEdit(event);
                      onClose();
                    }}
                  />
                )}
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 mr-3 text-gray-500" />
                  <span>
                    {formattedStartTime} - {formattedEndTime}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <CalendarIcon className="h-5 w-5 mr-3 text-gray-500" />
                  <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center text-gray-700">
                  <User className="h-5 w-5 mr-3 text-gray-500" />
                  <span>{event.technicianName}</span>
                </div>
                
                {event.sr && (
                  <div className="flex items-start text-gray-700">
                    <div className="h-5 w-5 mr-3 mt-0.5 text-gray-500 flex items-center justify-center">
                      <span className="font-bold">SR</span>
                    </div>
                    <div>
                      <div className="font-medium">{event.sr}</div>
                      {event.appointmentType && (
                        <div className="text-sm text-gray-500 mt-1">
                          Type: {event.appointmentType}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {event.area && (
                  <div className="flex items-start text-gray-700">
                    <MapPin className="h-5 w-5 mr-3 mt-0.5 text-gray-500" />
                    <span>{event.area}</span>
                  </div>
                )}
              </div>
              
              {/* Map integration if available */}
              {event.location && (
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <h5 className="font-medium text-gray-700 mb-3">Location</h5>
                  <EventMap location={event.location} />
                </div>
              )}
              
              {/* Event details if available */}
              {event.details && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-2">Details</h5>
                  <p className="text-gray-700 whitespace-pre-wrap">{event.details}</p>
                </div>
              )}
              
              {/* View details button */}
              {(event.testRecordId || event.appointmentType === 'AUTOPSY') && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
                    onClick={handleViewDetails}
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse border-t border-gray-200">
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Event Edit Form
const EventEditForm = ({
  event,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedEvent, setEditedEvent] = useState({...event});
  const [duration, setDuration] = useState("1h");
  
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

// Work Details Modal Component
const WorkDetailsModal = ({
  isOpen,
  onClose,
  recordId,
  appointmentType,
}) => {
  const [workDetails, setWorkDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && recordId) {
      fetchWorkDetails(recordId, appointmentType);
    }
  }, [isOpen, recordId, appointmentType]);

  const fetchWorkDetails = async (id, type) => {
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
          earthWorkRecord = listData.list.find((item) => item.testRecordId === id);
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
            Λεπτομέρειες Εργασίας
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
                    <CalendarIcon className="text-blue-500 w-5 h-5 mr-3" />
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
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};

// Map View Modal
const MapViewModal = ({
  isOpen,
  onClose,
  events,
  onEventClick
}) => {
  if (!isOpen) return null;

  // Filter events with location data
  const eventsWithLocation = events.filter(event => 
    event.location && event.location.latitude && event.location.longitude
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9000] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-aspro rounded-lg shadow-lg w-[92%] h-[90%] max-w-6xl max-h-[800px] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Χάρτης Εργασιών
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Κλείσιμο"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 relative">
          {eventsWithLocation.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No events with location data available
            </div>
          ) : (
            <div className="h-full bg-gray-100 p-4 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventsWithLocation.map(event => (
                  <div 
                    key={event.id}
                    className="bg-aspro p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onEventClick(event)}
                  >
                    <div className="flex items-start">
                      <MapPin className="text-blue-500 mr-2 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-gray-600">{event.location?.address || event.area}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.start), 'dd/MM/yyyy HH:mm')} • {event.technicianName}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Κλείσιμο
          </button>
        </div>
      </div>
    </div>
  );
};
// Main TimelineView component
// Main TimelineView component
const TimelineView = () => {
  // State (unchanged)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states (unchanged)
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkDetailsOpen, setIsWorkDetailsOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");

  // Filter states (unchanged)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    CONSTRUCTION: true,
    SPLICING: true,
    EARTHWORK: true,
    AUTOPSY: true,
  });
  const [activeTeamFilters, setActiveTeamFilters] = useState({
    "Technicians - Construct": true,
    "Technicians - Splicers": true,
    "Technicians - Soil": true,
    Autopsy: true,
  });
  const [activeTechnicianFilters, setActiveTechnicianFilters] = useState({});

  // Updated time slots for 1-hour increments from 08:00 to 20:00
  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
  ];

  // Filtered events (unchanged)
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeIsActive = !event.appointmentType || activeFilters[event.appointmentType];
      const technicianForEvent = technicians.find((tech) => tech.name === event.technicianName);
      const teamIsActive = !technicianForEvent?.team || activeTeamFilters[technicianForEvent.team];
      const technicianIsActive = !technicianForEvent?.id || activeTechnicianFilters[technicianForEvent.id];
      return typeIsActive && teamIsActive && technicianIsActive;
    });
  }, [events, activeFilters, activeTeamFilters, activeTechnicianFilters, technicians]);

  // API request state (unchanged)
  const fetchEventsTimeout = useRef(null);

  // Fetch technicians (unchanged)
  const fetchTechnicians = useCallback(async () => {
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
        data.list.map(async (user) => {
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

            const teams = Object.values(userDetail.teamsNames || {});
            const normalizedTeams = teams.map((team) =>
              typeof team === "string" ? team.replace(/\s+/g, " ").trim().toLowerCase() : ""
            );

            const teamMappings = {
              "technicians - construct": "Technicians - Construct",
              "technicians - splicers": "Technicians - Splicers",
              "technicians - soil": "Technicians - Soil",
              autopsy: "Autopsy",
            };

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
              team: matchedTeam,
            };
          } catch (error) {
            return null;
          }
        })
      );

      const filteredTechnicians = detailedTechnicians
        .filter((result) => result.status === "fulfilled" && result.value !== null)
        .map((result) => result.value);

      setTechnicians(filteredTechnicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      setError("Failed to load technicians. Please try again.");
    }
    setLoading(false);
  }, []);

  // Fetch events with 2-hour delay adjustment (unchanged)
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");

      const formattedDate = format(currentDate, "yyyy-MM-dd");

      const allEvents: ((prevState: never[]) => never[]) | { id: any; name: any; start: Date; end: Date; technicianName: any; technicianId: any; status: any; sr: any; testRecordId: any; area: any; details: any; appointmentType: string; location: { latitude: number; longitude: number; address: any; } | undefined; }[] = [];

      await Promise.all(
        CONSTRUCTION_API_ENDPOINTS.map(async (endpoint) => {
          const apiSource = endpoint.split("/").pop() || "Unknown";

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
              data.list.forEach((item) => {
                if (item.dateStart && item.assignedUserName) {
                  const appointmentType = getAppointmentTypeFromEndpoint(apiSource);

                  const serverStart = new Date(item.dateStart);
                  const serverEnd = item.dateEnd
                    ? new Date(item.dateEnd)
                    : addHours(new Date(item.dateStart), 1);

                  const adjustedStart = addHours(serverStart, 2);
                  const adjustedEnd = addHours(serverEnd, 2);

                  allEvents.push({
                    id: item.id || String(Math.random()),
                    name: item.name || apiSource,
                    start: adjustedStart,
                    end: adjustedEnd,
                    technicianName: item.assignedUserName,
                    technicianId: item.assignedUser,
                    status: item.status,
                    sr: apiSource === "Test" ? item.srText : item.sr,
                    testRecordId: item.testRecordId,
                    area:
                      item.addressCity ||
                      item.perioxi ||
                      (item.name?.includes(" Δ. ") ? "Δ. " + item.name.split(" Δ. ")[1] : ""),
                    details: item.details || item.description || item.info || item.sxolia,
                    appointmentType,
                    location:
                      (item.addressLatitude && item.addressLongitude) || item.mapsurl
                        ? {
                            latitude: parseFloat(
                              item.addressLatitude ||
                                (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[0] : "0")
                            ),
                            longitude: parseFloat(
                              item.addressLongitude ||
                                (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[1] : "0")
                            ),
                            address: item.addressStreet || item.address || item.name || "",
                          }
                        : undefined,
                  });
                }
              });
            }
          } catch (error) {
            console.error(`Error fetching from ${endpoint}:`, error);
          }
        })
      );

      allEvents.sort((a, b) => a.technicianName.localeCompare(b.technicianName));
      setEvents(allEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again.");
    }
    setLoading(false);
  }, [currentDate]);

  const getAppointmentTypeFromEndpoint = (endpoint: string) => {
    switch (endpoint) {
      case "CKataskeyastikadates":
        return "CONSTRUCTION";
      case "CSplicingWork":
        return "SPLICING";
      case "CEarthWork":
        return "EARTHWORK";
      case "Test":
        return "AUTOPSY";
      default:
        return "CONSTRUCTION";
    }
  };

  // Updated getTimelineEventStyle to match screenshot colors
  const getTimelineEventStyle = (appointmentType) => {
    switch (appointmentType) {
      case "CONSTRUCTION":
        return "bg-green-600 text-white";
      case "SPLICING":
        return "bg-red-600 text-white";
      case "EARTHWORK":
        return "bg-orange-600 text-white";
      case "AUTOPSY":
        return "bg-purple-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleSaveEvent = async (updatedEvent) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");

      setEvents((prevEvents) =>
        prevEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e))
      );

      setIsEditModalOpen(false);
      await fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      setError("Failed to save event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (testRecordId, appointmentType) => {
    if (!testRecordId) {
      alert("No test record ID available for this event.");
      return;
    }

    try {
      setSelectedWorkId(testRecordId);
      setSelectedWorkType(appointmentType || "");
      setIsWorkDetailsOpen(true);
      setIsEventDetailOpen(false);
    } catch (error) {
      console.error("Error in handleViewDetails:", error);
      alert("Error loading details. Please try again.");
    }
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
  };

  const handleTeamFilterChange = (newFilters) => {
    setActiveTeamFilters(newFilters);
  };

  const handleTechnicianFilterChange = (newFilters) => {
    setActiveTechnicianFilters(newFilters);
  };

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const teamIsActive = activeTeamFilters[tech.team];
      const technicianIsActive = activeTechnicianFilters[tech.id];
      const hasEvents = filteredEvents.some(
        (event) => event.technicianName === tech.name && isSameDay(new Date(event.start), currentDate)
      );
      return teamIsActive && technicianIsActive && hasEvents;
    });
  }, [technicians, activeTeamFilters, activeTechnicianFilters, filteredEvents, currentDate]);

  const techniciansWithEvents = useMemo(() => {
    const techNames = new Set();
    filteredEvents
      .filter((event) => isSameDay(new Date(event.start), currentDate))
      .forEach((event) => {
        techNames.add(event.technicianName);
      });
    return filteredTechnicians.filter((tech) => techNames.has(tech.name));
  }, [filteredEvents, currentDate, filteredTechnicians]);

  // Calculate the maximum number of lanes across all technicians
  const maxLanesAcrossTechnicians = useMemo(() => {
    let maxLanes = 1;
    techniciansWithEvents.forEach((tech) => {
      const techEvents = filteredEvents.filter(
        (event) => event.technicianName === tech.name && isSameDay(new Date(event.start), currentDate)
      );

      const eventLanes = [];
      const maxLanesForTech = 6;

      const sortedEvents = [...techEvents].sort((a, b) => {
        const startDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
        if (startDiff !== 0) return startDiff;
        const aDuration = new Date(a.end).getTime() - new Date(a.start).getTime();
        const bDuration = new Date(b.end).getTime() - new Date(b.start).getTime();
        return bDuration - aDuration;
      });

      sortedEvents.forEach((event) => {
        const eventStart = new Date(event.start).getTime();
        const eventEnd = new Date(event.end).getTime();

        let assignedLane = -1;

        for (let lane = 0; lane < maxLanesForTech; lane++) {
          if (!eventLanes[lane]) {
            eventLanes[lane] = [];
            assignedLane = lane;
            break;
          }

          let canFitInLane = true;
          for (const existingEvent of eventLanes[lane]) {
            const existingStart = new Date(existingEvent.start).getTime();
            const existingEnd = new Date(existingEvent.end).getTime();
            if (!(eventEnd <= existingStart || eventStart >= existingEnd)) {
              canFitInLane = false;
              break;
            }
          }

          if (canFitInLane) {
            assignedLane = lane;
            break;
          }
        }

        if (assignedLane === -1) {
          assignedLane = Math.min(eventLanes.length, maxLanesForTech - 1);
        }

        if (!eventLanes[assignedLane]) {
          eventLanes[assignedLane] = [];
        }

        eventLanes[assignedLane].push(event);
      });

      const usedLanes = eventLanes.filter((lane) => lane && lane.length > 0).length;
      maxLanes = Math.max(maxLanes, usedLanes);
    });
    return maxLanes;
  }, [techniciansWithEvents, filteredEvents, currentDate]);

  useEffect(() => {
    if (technicians.length > 0) {
      const uniqueTeams = new Set();
      technicians.forEach((tech) => {
        if (tech.team) uniqueTeams.add(tech.team);
      });

      const initialTeamFilters = Array.from(uniqueTeams).reduce((acc, team) => {
        acc[team] = true;
        return acc;
      }, {});

      setActiveTeamFilters((prev) => ({
        ...initialTeamFilters,
        ...prev,
      }));

      const initialTechnicianFilters = technicians.reduce((acc, tech) => {
        acc[tech.id] = true;
        return acc;
      }, {});

      setActiveTechnicianFilters(initialTechnicianFilters);
    }
  }, [technicians]);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

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

  const activeFilterCount = useMemo(() => {
    const appointmentTypeFilterCount = Object.values(activeFilters).filter((v) => !v).length;
    const teamFilterCount = Object.values(activeTeamFilters).filter((v) => !v).length;
    const technicianFilterCount = Object.values(activeTechnicianFilters).filter((v) => !v).length;
    return appointmentTypeFilterCount + teamFilterCount + technicianFilterCount;
  }, [activeFilters, activeTeamFilters, activeTechnicianFilters]);

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-700">Loading timeline data...</p>
        </div>
      </div>
    );
  }

  // Constants for layout
  const laneHeight = 28; // Adjusted height for better fit
  const laneSpacing = 4; // Spacing between stacked events
  const rowHeight = Math.max(maxLanesAcrossTechnicians * (laneHeight + laneSpacing) + 12, 48); // Uniform row height

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-aspro border-b py-3 px-6 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900">FieldX Timeline</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="p-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 relative"
              onClick={() => setIsFilterPanelOpen(true)}
            >
              <Filter size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              className="p-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setIsMapModalOpen(true)}
            >
              <MapPin size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Date navigation bar */}
      <div className="bg-aspro border-b py-3 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800">{format(currentDate, "E d MMM yyyy")}</h2>
          <button
            onClick={goToToday}
            className="ml-3 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          >
            Επιστροφή στη σημερινή μέρα
          </button>
        </div>
        <div className="flex items-center">
          <button className="p-1.5 rounded-full hover:bg-gray-100" onClick={goToPrevious}>
            <ChevronLeft size={20} />
          </button>
          <button className="p-1.5 rounded-full hover:bg-gray-100" onClick={goToNext}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <p>{error}</p>
          </div>
          <button onClick={fetchEvents} className="mt-2 text-sm underline">
            Retry
          </button>
        </div>
      )}

      {/* Timeline View */}
      <div className="flex-1 p-4">
        <div className="bg-aspro border rounded-lg shadow-sm overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Time headers */}
            <div className="grid grid-cols-[250px_1fr] border-b">
              <div className="p-3 font-medium text-gray-800 border-r bg-gray-50"></div>
              <div className="grid grid-cols-12">
                {timeSlots.slice(0, 12).map((time, index) => (
                  <div
                    key={time}
                    className={`p-3 text-center font-medium text-gray-600 bg-gray-50 ${index < 11 ? "border-r" : ""}`}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Technician rows with events */}
            {techniciansWithEvents.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No events scheduled for this day.</div>
            ) : (
              techniciansWithEvents.map((tech, index) => {
                const techEvents = filteredEvents.filter(
                  (event) =>
                    event.technicianName === tech.name && isSameDay(new Date(event.start), currentDate)
                );

                // Calculate lanes for this technician
                const eventLanes: string | any[] = [];
                const maxLanes = 6;

                const sortedEvents = [...techEvents].sort((a, b) => {
                  const startDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
                  if (startDiff !== 0) return startDiff;
                  const aDuration = new Date(a.end).getTime() - new Date(a.start).getTime();
                  const bDuration = new Date(b.end).getTime() - new Date(b.start).getTime();
                  return bDuration - aDuration;
                });

                sortedEvents.forEach((event) => {
                  const eventStart = new Date(event.start).getTime();
                  const eventEnd = new Date(event.end).getTime();

                  let assignedLane = -1;

                  for (let lane = 0; lane < maxLanes; lane++) {
                    if (!eventLanes[lane]) {
                      eventLanes[lane] = [];
                      assignedLane = lane;
                      break;
                    }

                    let canFitInLane = true;
                    for (const existingEvent of eventLanes[lane]) {
                      const existingStart = new Date(existingEvent.start).getTime();
                      const existingEnd = new Date(existingEvent.end).getTime();
                      if (!(eventEnd <= existingStart || eventStart >= existingEnd)) {
                        canFitInLane = false;
                        break;
                      }
                    }

                    if (canFitInLane) {
                      assignedLane = lane;
                      break;
                    }
                  }

                  if (assignedLane === -1) {
                    assignedLane = Math.min(eventLanes.length, maxLanes - 1);
                  }

                  if (!eventLanes[assignedLane]) {
                    eventLanes[assignedLane] = [];
                  }

                  eventLanes[assignedLane].push(event);
                });

                return (
                  <div
                    key={tech.id}
                    className={`grid grid-cols-[250px_1fr] ${index < techniciansWithEvents.length - 1 ? "border-b" : ""}`}
                    style={{ height: `${rowHeight}px` }} // Uniform row height
                  >
                    {/* Technician name */}
                    <div className="p-4 flex items-center space-x-3 border-r bg-aspro">
                      <InitialsAvatar name={tech.name} className="w-8 h-8 text-sm" />
                      <div>
                        <div className="font-medium text-sm">{tech.name}</div>
                        <div className="text-xs text-gray-500">{tech.team}</div>
                      </div>
                    </div>

                    {/* Events timeline */}
                    <div className="relative h-full">
                      {/* Hour dividers */}
                      <div className="grid grid-cols-12 h-full">
                        {timeSlots.slice(0, 12).map((time, i) => (
                          <div
                            key={time}
                            className={`h-full ${i < 11 ? "border-r border-gray-100" : ""}`}
                          ></div>
                        ))}
                      </div>

                      {/* Events */}
                      {(() => {
                        const processedEvents: any[] = [];
                        const eventLanes = [];

                        sortedEvents.forEach((event) => {
                          const eventStart = new Date(event.start).getTime();
                          const eventEnd = new Date(event.end).getTime();

                          let assignedLane = -1;

                          for (let lane = 0; lane < maxLanes; lane++) {
                            if (!eventLanes[lane]) {
                              eventLanes[lane] = [];
                              assignedLane = lane;
                              break;
                            }

                            let canFitInLane = true;
                            for (const existingEvent of eventLanes[lane]) {
                              const existingStart = new Date(existingEvent.start).getTime();
                              const existingEnd = new Date(existingEvent.end).getTime();
                              if (!(eventEnd <= existingStart || eventStart >= existingEnd)) {
                                canFitInLane = false;
                                break;
                              }
                            }

                            if (canFitInLane) {
                              assignedLane = lane;
                              break;
                            }
                          }

                          if (assignedLane === -1) {
                            assignedLane = Math.min(eventLanes.length, maxLanes - 1);
                          }

                          if (!eventLanes[assignedLane]) {
                            eventLanes[assignedLane] = [];
                          }

                          eventLanes[assignedLane].push(event);
                          processedEvents.push({ ...event, laneIndex: assignedLane });
                        });

                        return processedEvents.map((event) => {
                          const appointmentClass = getTimelineEventStyle(event.appointmentType);

                          const startDate = new Date(event.start);
                          const endDate = new Date(event.end);

                          const totalMinutesInRange = 12 * 60; // 12 hours from 08:00 to 20:00
                          const startHour = startDate.getHours();
                          const startMinutes = startHour * 60 + startDate.getMinutes();
                          const endHour = endDate.getHours();
                          const endMinutes = endHour * 60 + endDate.getMinutes();

                          const startMinutesFromRangeStart = Math.max(0, startMinutes - 8 * 60);
                          const endMinutesFromRangeStart = Math.min(totalMinutesInRange, endMinutes - 8 * 60);

                          const left = (startMinutesFromRangeStart / totalMinutesInRange) * 100;
                          const width = ((endMinutesFromRangeStart - startMinutesFromRangeStart) / totalMinutesInRange) * 100;

                          if (startHour >= 20 || endHour < 8) return null; // Skip events outside range

                          const top = event.laneIndex * (laneHeight + laneSpacing) + 6;

                          return (
                            <div
                              key={event.id}
                              className={`absolute rounded-lg shadow-md cursor-pointer transition-all duration-200 ${appointmentClass} border border-white/30 hover:shadow-lg hover:brightness-110 hover:z-50`}
                              style={{
                                left: `${left}%`,
                                width: `${Math.max(width, 5)}%`,
                                height: `${laneHeight}px`,
                                top: `${top}px`,
                                zIndex: event.laneIndex + 10,
                              }}
                              onClick={() => handleEventClick(event)}
                              title={`${event.name} (${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")})`}
                            >
                              <div className="h-full flex items-center px-2 overflow-hidden">
                                <span className="text-sm font-medium flex flex-wrap">{event.name}</span>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        activeFilters={activeFilters}
        activeTeamFilters={activeTeamFilters}
        activeTechnicianFilters={activeTechnicianFilters}
        onFilterChange={handleFilterChange}
        onTeamFilterChange={handleTeamFilterChange}
        onTechnicianFilterChange={handleTechnicianFilterChange}
        technicians={technicians}
      />

      {/* Modals */}
      {selectedEvent && (
        <>
          <EventDetailModal
            event={selectedEvent}
            isOpen={isEventDetailOpen}
            onClose={() => setIsEventDetailOpen(false)}
            onViewDetails={handleViewDetails}
            onEdit={handleEditEvent}
            technicianName={selectedEvent.technicianName}
          />
          <EventEditForm
            event={selectedEvent}
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSave={handleSaveEvent}
          />
        </>
      )}
      <WorkDetailsModal
        isOpen={isWorkDetailsOpen}
        onClose={() => setIsWorkDetailsOpen(false)}
        recordId={selectedWorkId}
        appointmentType={selectedWorkType}
      />
      <MapViewModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        events={filteredEvents}
        onEventClick={handleEventClick}
      />
    </div>
  );
};

export default TimelineView;