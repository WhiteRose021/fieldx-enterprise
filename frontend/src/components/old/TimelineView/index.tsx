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
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths,
  eachDayOfInterval, isSameDay, isSameMonth, format, getMonth, getYear,
  addDays, startOfDay, addHours, parseISO,
} from "date-fns";
import { el } from "date-fns/locale"; // Greek locale
import { motion, AnimatePresence } from "framer-motion";
import EventDetailModal from '../Calendar/EventDetailModal';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';


// Enums and Types
enum AppointmentTypeEnum {
  CONSTRUCTION = "CONSTRUCTION",
  SPLICING = "SPLICING",
  EARTHWORK = "EARTHWORK",
  AUTOPSY = "AUTOPSY",
}

const APPOINTMENT_TYPE_LABELS = {
    AUTOPSY: "Αυτοψίες",
    CONSTRUCTION: "Κατασκευές",
    SPLICING: "Κολλήσεις",
    EARTHWORK: "Χωματουργικά",
};

// Added Greek translations for team names
const TEAM_NAME_TRANSLATIONS = {
  "Technicians - Construct": "Κατασκευαστής",
  "Technicians - Splicers": "Τεχνικός Κολλήσεων",
  "Technicians - Soil": "Χωματουργός",
  "Autopsy": "Τεχνικός Αυτοψίας",
};

const TEAM_TO_APPOINTMENT_TYPE = {
    "Autopsy": "AUTOPSY",
    "Technicians - Construct": "CONSTRUCTION",
    "Technicians - Splicers": "SPLICING",
    "Technicians - Soil": "EARTHWORK",
};

const APPOINTMENT_TYPE_ORDER = ["AUTOPSY", "CONSTRUCTION", "SPLICING", "EARTHWORK"];

// Background colors for job modal sections
const APPOINTMENT_TYPE_COLORS = {
    AUTOPSY: "bg-purple-50",
    CONSTRUCTION: "bg-green-50",
    SPLICING: "bg-blue-50",
    EARTHWORK: "bg-orange-50",
};

type AppointmentType = keyof typeof AppointmentTypeEnum;
type EventStatus = "ΟΛΟΚΛΗΡΩΣΗ" | "ΑΠΟΣΤΟΛΗ" | "ΑΠΟΡΡΙΨΗ" | "ΜΗ ΟΛΟΚΛΗΡΩΣΗ" | "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ" | "default";

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
  };
}

interface Technician {
  id: string;
  name: string;
  team: string;
}

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
  showBackToJobs?: boolean;
  onBackToJobs?: () => void;
}

// Helper function to truncate text based on job duration
const truncateEventName = (name: string, startDate: Date, endDate: Date): string => {
  const durationInMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
  // Set character limit based on duration
  let charLimit = 12; // Default for short jobs
  
  if (durationInMinutes >= 60) {
    charLimit = 20; // For jobs 1 hour or longer
  }
  if (durationInMinutes >= 120) {
    charLimit = 30; // For jobs 2 hours or longer
  }
  
  if (name.length <= charLimit) return name;
  return name.substring(0, charLimit - 3) + '...';
};

// API Configurations
const API_CONFIGS = {
  Test: { bg: "bg-purple-500", border: "border-purple-600", shadow: "shadow-purple-500/20", text: "text-purple-700", icon: User, label: "Αυτοψίες" },
  CSplicingWork: { bg: "bg-blue-500", border: "border-blue-600", shadow: "shadow-blue-500/20", text: "text-blue-700", icon: User, label: "Κολλήσεις", statusColors: { ΝΕΟ: { bg: "bg-blue-500", border: "border-blue-600", shadow: "shadow-blue-500/20", text: "text-blue-700" }, ΑΠΟΣΤΟΛΗ: { bg: "bg-orange-500", border: "border-orange-600", shadow: "shadow-orange-500/20", text: "text-orange-700" } } },
  CEarthWork: { bg: "bg-orange-500", border: "border-orange-600", shadow: "shadow-orange-500/20", text: "text-orange-700", icon: User, label: "Χωματουργικά" },
  CKataskeyastikadates: { bg: "bg-green-500", border: "border-green-600", shadow: "shadow-green-500/20", text: "text-green-700", icon: User, label: "Κατασκευές" },
};

const CONSTRUCTION_API_ENDPOINTS = [
  "http://192.168.4.150:8080/api/v1/Test",
  "http://192.168.4.150:8080/api/v1/CSplicingWork",
  "http://192.168.4.150:8080/api/v1/CKataskeyastikadates",
  "http://192.168.4.150:8080/api/v1/CEarthWork",
];

const APIs = [
  { id: "CONSTRUCTION", name: "Ραντεβού Κατασκευαστικού", endpoint: "CKataskeyastikadates", team: "Technicians - Construct" },
  { id: "SPLICING", name: "Ραντεβού Κολλήσεων", endpoint: "CSplicingdate", team: "Technicians - Splicers" },
  { id: "EARTHWORK", name: "Ραντεβού Χωματουργικού", endpoint: "CEarthWork", team: "Technicians - Soil" },
  { id: "AUTOPSY", name: "Ραντεβού Αυτοψίας", endpoint: "Test", team: "Autopsy" },
];

// Event Style Mappings
const TIMELINE_EVENT_STYLES = {
  CONSTRUCTION: "bg-green-600 text-white",
  SPLICING: "bg-red-600 text-white",
  EARTHWORK: "bg-orange-600 text-white",
  AUTOPSY: "bg-purple-600 text-white",
  default: "bg-gray-600 text-white",
};

// Add this new constant for status-based styling:
const STATUS_EVENT_STYLES = {
  "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-600 text-white",     // Green for completed
  "ΑΠΟΣΤΟΛΗ": "bg-black text-white",           // Black for dispatched
  "ΑΠΟΡΡΙΨΗ": "bg-yellow-500 text-white",      // Yellow for rejected
  "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-600 text-white",    // Red for incomplete
  "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ": "bg-blue-600 text-white",  
  default: "bg-gray-600 text-white",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .join(".")
    .toUpperCase();

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ["#E11D48", "#7C3AED", "#2563EB", "#0891B2", "#059669", "#EA580C", "#9333EA", "#C026D3", "#0D9488", "#65A30D"];
  return colors[Math.abs(hash) % colors.length];
};

// Translate team name from English to Greek
const translateTeamName = (team: string): string => {
  return TEAM_NAME_TRANSLATIONS[team] || team;
};

// Components
const InitialsAvatar = ({ name, className = "" }: { name: string; className?: string }) => {
  const initials = getInitials(name);
  const backgroundColor = stringToColor(name);
  return (
    <div className={`flex items-center justify-center rounded-full ${className}`} style={{ backgroundColor }}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
};

const getTimelineEventStyle = (event: Event | string) => {
  // If we're passing an event object
  if (typeof event !== 'string') {
    if (event.status && STATUS_EVENT_STYLES[event.status as keyof typeof STATUS_EVENT_STYLES]) {
      return STATUS_EVENT_STYLES[event.status as keyof typeof STATUS_EVENT_STYLES];
    }
    return TIMELINE_EVENT_STYLES[(event.appointmentType as keyof typeof TIMELINE_EVENT_STYLES) || "default"];
  }
  // For backward compatibility (if we're passing just an appointmentType string)
  return TIMELINE_EVENT_STYLES[(event as keyof typeof TIMELINE_EVENT_STYLES) || "default"];
};

const FilterPanel = ({
  isOpen,
  onClose,
  activeFilters,
  activeTechnicianFilters,
  onFilterChange,
  onTechnicianFilterChange,
  technicians,
}: {
  isOpen: boolean;
  onClose: () => void;
  activeFilters: Record<string, boolean>;
  activeTechnicianFilters: Record<string, boolean>;
  onFilterChange: (filters: Record<string, boolean>) => void;
  onTechnicianFilterChange: (filters: Record<string, boolean>) => void;
  technicians: Technician[];
}) => {
  const [tempFilters, setTempFilters] = useState(activeFilters);
  const [tempTechnicianFilters, setTempTechnicianFilters] = useState(activeTechnicianFilters);
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

  const uniqueTeams = useMemo(() => {
    const teams = new Set<string>();
    technicians.forEach((tech) => tech.team && teams.add(tech.team));
    return Array.from(teams).sort((a, b) => {
      const aType = TEAM_TO_APPOINTMENT_TYPE[a] || "";
      const bType = TEAM_TO_APPOINTMENT_TYPE[b] || "";
      return APPOINTMENT_TYPE_ORDER.indexOf(aType) - APPOINTMENT_TYPE_ORDER.indexOf(bType);
    });
  }, [technicians]);

  useEffect(() => {
    if (isOpen) {
      setTempFilters({ ...activeFilters });
      setTempTechnicianFilters({ ...activeTechnicianFilters });
    }
  }, [isOpen, activeFilters, activeTechnicianFilters]);

  const handleFilterToggle = (type: string) => setTempFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  const handleTechnicianFilterToggle = (techId: string) => setTempTechnicianFilters((prev) => ({ ...prev, [techId]: !prev[techId] }));
  const toggleTeam = (team: string) => setOpenTeams((prev) => ({ ...prev, [team]: !prev[team] }));

  const handleSelectAllTypes = () => setTempFilters(Object.keys(tempFilters).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
  const handleSelectNoneTypes = () => setTempFilters(Object.keys(tempFilters).reduce((acc, key) => ({ ...acc, [key]: false }), {}));

  const handleSelectAllTechniciansForTeam = (team: string) => {
    const teamTechnicians = technicians.filter((tech) => tech.team === team);
    setTempTechnicianFilters((prev) => ({
      ...prev,
      ...teamTechnicians.reduce((acc, tech) => ({ ...acc, [tech.id]: true }), {}),
    }));
  };

  const handleSelectNoneTechniciansForTeam = (team: string) => {
    const teamTechnicians = technicians.filter((tech) => tech.team === team);
    setTempTechnicianFilters((prev) => ({
      ...prev,
      ...teamTechnicians.reduce((acc, tech) => ({ ...acc, [tech.id]: false }), {}),
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange(tempFilters);
    onTechnicianFilterChange(tempTechnicianFilters);
    onClose();
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
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="px-4 py-3 max-h-[80vh] overflow-y-auto">
            {/* Appointment Categories Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-md font-medium text-gray-700">Κατηγορίες Ραντεβού</label>
                <div className="flex space-x-2">
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={handleSelectAllTypes}>
                    Επιλογή Όλων
                  </button>
                  <span className="text-gray-300">|</span>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-800" onClick={handleSelectNoneTypes}>
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
                    <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempFilters[type] ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
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
                const label = appointmentType ? APPOINTMENT_TYPE_LABELS[appointmentType] : translateTeamName(team); // Use translated team name
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
                            <div className={`w-5 h-5 border rounded flex items-center justify-center mr-3 ${tempTechnicianFilters[tech.id] ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
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

const JobsModal = ({ isOpen, onClose, events, onEventClick, currentDate }: 
  { isOpen: boolean; onClose: () => void; events: Event[]; onEventClick: (event: Event, fromJobsModal?: boolean) => void; currentDate: Date }) => {  
  if (!isOpen) return null;

  // Filter events to only include those for the current date
  const filteredEvents = events.filter(event => isSameDay(new Date(event.start), currentDate));

  const categorizedEvents = useMemo(() => {
    const categories: Record<string, Event[]> = {
      AUTOPSY: [],
      CONSTRUCTION: [],
      SPLICING: [],
      EARTHWORK: [],
    };
    
    filteredEvents.forEach((event) => {
      const category = event.appointmentType || "CONSTRUCTION";
      categories[category].push(event);
    });
    
    Object.keys(categories).forEach((key) => {
      categories[key].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
    
    return categories;
  }, [filteredEvents]);

  // Determine which categories have events to display
  const hasEvents = (category: string) => categorizedEvents[category].length > 0;
  const activeCategories = APPOINTMENT_TYPE_ORDER.filter(hasEvents);

  // Calculate the appropriate grid column count based on active categories
  const gridColClass = activeCategories.length === 0 ? "grid-cols-1" : 
                      activeCategories.length === 1 ? "grid-cols-1" :
                      activeCategories.length === 2 ? "grid-cols-1 md:grid-cols-2" :
                      activeCategories.length === 3 ? "grid-cols-1 md:grid-cols-3" :
                      "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9000] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-aspro rounded-lg shadow-lg w-[95%] max-w-6xl h-[90vh] max-h-[800px] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 z-10 bg-aspro">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Επισκόπηση Εργασιών - {format(currentDate, "dd/MM/yyyy", { locale: el })}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Κλείσιμο">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-auto">
          {activeCategories.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-lg">
              Δεν υπάρχουν προγραμματισμένες εργασίες για σήμερα
            </div>
          ) : (
            <div className={`grid ${gridColClass} gap-4`}>
              {APPOINTMENT_TYPE_ORDER.map((type) => {
                // Skip categories with no events
                if (categorizedEvents[type].length === 0) return null;
                
                return (
                  <div key={type} className={`${APPOINTMENT_TYPE_COLORS[type]} p-4 rounded-lg border shadow-sm`}>
                    <h3 className="font-medium text-lg mb-2">{APPOINTMENT_TYPE_LABELS[type]}</h3>
                    <div className="space-y-2 max-h-[calc(90vh-150px)] overflow-y-auto">
                      {categorizedEvents[type].map((event) => (
                        <div
                          key={event.id}
                          className="p-2 bg-aspro rounded-md shadow-sm hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => onEventClick(event, true)}
                        >
                          <p className="font-medium">{event.name}</p>
                          <p className="text-sm text-gray-600">{event.technicianName}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(event.start), "HH:mm", { locale: el })} - {format(new Date(event.end), "HH:mm", { locale: el })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Κλείσιμο</button>
        </div>
      </div>
    </div>
  );
};

const EventEditForm = ({ event, isOpen, onClose, onSave }: { event: Event; isOpen: boolean; onClose: () => void; onSave: (event: Event) => void }) => {
  const [editedEvent, setEditedEvent] = useState({ ...event });
  const [duration, setDuration] = useState("1h");

  useEffect(() => {
    if (isOpen) {
      setEditedEvent({ ...event });
      const start = new Date(event.start);
      const end = new Date(event.end);
      const diffHours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      setDuration(`${diffHours}h`);
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const startTime = new Date(editedEvent.start);
    const [hours] = duration.split("h");
    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + parseInt(hours));
    onSave({ ...editedEvent, end: endTime });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-aspro rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] m-4 overflow-hidden">
        <div className="bg-blue-500 text-white p-4 flex justify-between items-center">
          <h3 className="font-medium">ΕΠΕΞΕΡΓΑΣΙΑ · {event.appointmentType || "ΡΑΝΤΕΒΟΥ"}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ΕΝΑΡΞΗ ΡΑΝΤΕΒΟΥ</label>
              <div className="text-gray-700">{format(new Date(editedEvent.start), "yyyy-MM-dd HH:mm", { locale: el })}</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ΔΙΑΡΚΕΙΑ</label>
              <div className="relative">
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                <select value={editedEvent.details?.includes("ΟΛΕΡΑΤ") ? "ΝΑΙ" : "ΟΧΙ"} onChange={(e) => setEditedEvent({ ...editedEvent, details: e.target.value === "ΝΑΙ" ? (editedEvent.details || "") + " ΟΛΕΡΑΤ" : (editedEvent.details || "").replace("ΟΛΕΡΑΤ", "") })} className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
              <textarea value={editedEvent.details || ""} onChange={(e) => setEditedEvent({ ...editedEvent, details: e.target.value })} className="w-full p-2 border rounded min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Εισάγετε σχόλια εδώ..." />
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">ΧΡΗΣΤΗΣ</label>
              <div className="relative">
                <input type="text" value={editedEvent.technicianName} onChange={(e) => setEditedEvent({ ...editedEvent, technicianName: e.target.value })} className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent" readOnly />
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
                <input type="text" placeholder="Επιλέξτε" className="w-full p-2 border rounded bg-aspro focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t p-4 bg-gray-50 flex">
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2">
            ΑΠΟΘΗΚΕΥΣΗ
          </button>
          <button className="px-4 py-2 bg-aspro border border-gray-300 text-gray-700 rounded hover:bg-gray-100 mr-2">ΣΤΟΙΧΕΙΑ ΕΡΓΑΣΙΑΣ</button>
          <button onClick={onClose} className="px-4 py-2 bg-aspro border border-gray-300 text-gray-700 rounded hover:bg-gray-100">ΑΚΥΡΩΣΗ</button>
        </div>
      </div>
    </div>
  );
};

const WorkDetailsModal = ({ isOpen, onClose, recordId, appointmentType }: WorkDetailsModalProps) => {
  const [workDetails, setWorkDetails] = useState<WorkDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Fix for Leaflet default icon issue (add at the top of your component file)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only run on client side
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && recordId) fetchWorkDetails(recordId, appointmentType);
  }, [isOpen, recordId, appointmentType]);

  const fetchWorkDetails = async (id: string, type?: string) => {
    setLoading(true);
    setError(null);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Δεν βρέθηκε το token πιστοποίησης");

      let endpoint;
      let data;
      
      // Same fetch logic as before
      // Keeping all your existing code for fetching data from different endpoints
      if (type === "EARTHWORK") {
        const listResponse = await fetch("http://192.168.4.150:8080/api/v1/CEarthWork", {
          headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" },
        });
        if (!listResponse.ok) throw new Error(`Αποτυχία φόρτωσης λίστας EarthWork: ${listResponse.status}`);
        const listData = await listResponse.json();
        const earthWorkRecord = listData?.list?.find((item: any) => item.testRecordId === id);
        if (!earthWorkRecord) throw new Error(`Δεν βρέθηκε η εγγραφή EarthWork με testRecordId ${id}`);
        const detailResponse = await fetch(`http://192.168.4.150:8080/api/v1/CEarthWork/${earthWorkRecord.id}`, {
          headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" },
        });
        if (!detailResponse.ok) throw new Error(`Αποτυχία φόρτωσης λεπτομερειών EarthWork: ${detailResponse.status}`);
        data = await detailResponse.json();
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxi || data.perioxitext || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : "") || "",
          sr: data.sr || data.srText || id,
          status: data.status || "",
          difficulty: data.difficultyLevel || "",
          difficultyValue: data.difficultyValue || "",
          jobType: data.category || "",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "",
          priority: data.priority || "",
          requiredTechnicians: data.requiredTechnicians || "",
          channels: data.kagkela === "ΝΑΙ" || data.channels === "ΝΑΙ" || false,
          excavation: data.mikosChwma > 0 || data.excavation === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || data.conduit === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || data.ftu === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || data.usage === "ΝΑΙ" || false,
          bmo: data.bmo || "",
          bcp: data.bcp === "ΝΑΙ" || data.hasBCP === "ΝΑΙ" || false,
          description: data.description || data.customerName || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "",
          timeSlot: data.dateStart && data.dateEnd ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` : "",
          latitude: parseFloat(data.lat || data.addressLatitude || data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 0,
          longitude: parseFloat(data.long || data.addressLongitude || data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 0,
        });
      } 
      // Keep all other API endpoints and their logic as they are in the original code
      else if (type === "AUTOPSY") {
        // Your existing AUTOPSY type logic
        endpoint = `http://192.168.4.150:8080/api/v1/Test/${id}`;
        const response = await fetch(endpoint, { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(`Αποτυχία φόρτωσης λεπτομερειών Test: ${response.status}`);
        data = await response.json();
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.clientAddress || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxitext || data.dimos || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : "") || "",
          sr: data.sr || data.srText || data.tobbsrid || id,
          status: data.status || data.fieldstatus || "",
          difficulty: data.difficulty || "",
          difficultyValue: data.dyskolia ? `(${data.dyskolia})` : "",
          jobType: data.category || "",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "",
          priority: data.priority || "",
          requiredTechnicians: "",
          channels: data.kagkela === "ΝΑΙ" || false,
          excavation: data.excavation === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || data.conduit === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || "",
          bcp: data.bcp === "ΝΑΙ" || data.existingbcp === "ΝΑΙ" || data.needBCP === "ΝΑΙ" || false,
          description: data.description || data.clientName || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "",
          timeSlot: data.dateStart && data.dateEnd ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` : "",
          latitude: parseFloat(data.lat || data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 0,
          longitude: parseFloat(data.long || data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 0,
        });
      } else if (type === "CONSTRUCTION") {
        endpoint = `http://192.168.4.150:8080/api/v1/CKataskeyastikadates/${id}`;
        const response = await fetch(endpoint, { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(`Αποτυχία φόρτωσης λεπτομερειών Construction: ${response.status}`);
        data = await response.json();
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.addressfront || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxi || data.perioxitext || data.dimos || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : "") || "",
          sr: data.sr || data.srText || id,
          status: data.status || "",
          difficulty: data.difficultLevel || data.dyskoliakat || "",
          difficultyValue: "",
          jobType: data.category || "",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "",
          priority: "",
          requiredTechnicians: "",
          channels: data.kagkela === "ΝΑΙ" || false,
          excavation: data.earthWork === "ΝΑΙ" || data.chwma === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || data.tobbbmotype || "",
          bcp: data.bcp === "ΝΑΙ" || data.needBCP === "ΝΑΙ" || false,
          description: data.description || data.customerName || data.adminname || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "",
          timeSlot: data.dateStart && data.dateEnd ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` : "",
          latitude: parseFloat(data.addressLatitude || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 0,
          longitude: parseFloat(data.addressLongitude || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 0,
        });
        if (!data.name) console.error(`Missing 'name' for CONSTRUCTION id: ${id}`);
        if (!data.dateStart) console.error(`Missing 'dateStart' for CONSTRUCTION id: ${id}`);
        if (!data.addressLatitude && !data.mapsurl) console.error(`Missing location data for CONSTRUCTION id: ${id}`);
      } else if (type === "SPLICING") {
        endpoint = `http://192.168.4.150:8080/api/v1/CSplicingWork/${id}`;
        const response = await fetch(endpoint, { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(`Αποτυχία φόρτωσης λεπτομερειών Splicing: ${response.status}`);
        data = await response.json();
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.name?.split(" Δ. ")[0] || "",
          area: data.perioxi || data.perioxitext || (data.name?.includes(" Δ. ") ? "Δ. " + data.name.split(" Δ. ")[1] : "") || "",
          sr: data.sr || data.srText || id,
          status: data.status || "",
          difficulty: "",
          difficultyValue: "",
          jobType: data.category || "",
          estimatedHours: data.duration ? (data.duration / 3600).toString() : "",
          priority: "",
          requiredTechnicians: "",
          channels: data.kagkela === "ΝΑΙ" || data.enaeria === "ΝΑΙ" || false,
          excavation: data.chwma === "ΝΑΙ" || false,
          conduit: data.kanali === "ΝΑΙ" || false,
          ftu: data.kya === "ΝΑΙ" || false,
          usage: data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || data.tobbbmotype || "",
          bcp: data.bcp === "ΝΑΙ" || false,
          description: data.description || data.info || data.infoHtml || data.customerName || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "",
          timeSlot: data.dateStart && data.dateEnd ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` : "",
          latitude: parseFloat(data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 0,
          longitude: parseFloat(data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 0,
        });
        if (!data.name) console.error(`Missing 'name' for SPLICING id: ${id}`);
        if (!data.dateStart) console.error(`Missing 'dateStart' for SPLICING id: ${id}`);
        if (!data.tobblat && !data.mapsurl) console.error(`Missing location data for SPLICING id: ${id}`);
      } else {
        endpoint = `http://192.168.4.150:8080/api/v1/Test/${id}`;
        const response = await fetch(endpoint, { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
        if (!response.ok) throw new Error(`Αποτυχία φόρτωσης λεπτομερειών: ${response.status}`);
        data = await response.json();
        setWorkDetails({
          id: data.id || id,
          title: data.name || "",
          address: data.address || data.addressStreet || data.clientAddress || data.name?.split(" Δ. ")[0] || "",
          area: data.area || data.addressCity || data.perioxi || data.perioxitext || data.dimos || "",
          sr: data.sr || data.srText || id,
          status: data.status || "",
          difficulty: data.difficulty || data.difficultyLevel || "",
          difficultyValue: data.difficultyValue || "",
          jobType: data.jobType || data.category || "",
          estimatedHours: data.estimatedHours || "",
          priority: data.priority || "",
          requiredTechnicians: data.requiredTechnicians || "",
          channels: data.channels === "true" || data.channels === true || data.kagkela === "ΝΑΙ" || false,
          excavation: data.excavation === "true" || data.excavation === true || data.chwma === "ΝΑΙ" || false,
          conduit: data.conduit === "true" || data.conduit === true || data.kanali === "ΝΑΙ" || false,
          ftu: data.ftu === "true" || data.ftu === true || data.kya === "ΝΑΙ" || false,
          usage: data.usage === "true" || data.usage === true || data.xrewsh === "ΝΑΙ" || false,
          bmo: data.bmo || "",
          bcp: data.bcp === "true" || data.bcp === true || data.hasBCP === "ΝΑΙ" || false,
          description: data.description || data.sxolia || "",
          team: data.teamsNames ? Object.values(data.teamsNames)[0] : "",
          date: data.dateStart ? data.dateStart.split(" ")[0] : "",
          timeSlot: data.dateStart && data.dateEnd ? `${data.dateStart.split(" ")[1].substring(0, 5)} - ${data.dateEnd.split(" ")[1].substring(0, 5)}` : "",
          latitude: parseFloat(data.addressLatitude || data.lat || data.tobblat || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[0] : "")) || 0,
          longitude: parseFloat(data.addressLongitude || data.long || data.tobblong || (data.mapsurl ? data.mapsurl.split("q=")[1]?.split(",")[1] : "")) || 0,
        });
        if (!data.name) console.error(`Missing 'name' for default type id: ${id}`);
        if (!data.dateStart) console.error(`Missing 'dateStart' for default type id: ${id}`);
        if (!data.addressLatitude && !data.lat && !data.tobblat && !data.mapsurl) console.error(`Missing location data for default type id: ${id}`);
      }
    } catch (error) {
      console.error("Σφάλμα φόρτωσης λεπτομερειών εργασίας:", error);
      setError("Αποτυχία φόρτωσης λεπτομερειών εργασίας. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const MapComponent = ({ location, address }: { location: { latitude: number; longitude: number }, address: string }) => {
    if (!mapLoaded || typeof window === 'undefined') {
      return (
        <div className="h-full flex items-center justify-center bg-gray-100">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      );
    }

    const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
    const L = require('leaflet');

    // Create a custom icon to match your app's style
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px #ef4444"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    return (
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker 
          position={[location.latitude, location.longitude]}
          icon={customIcon}
        >
          <Popup>
            <div className="p-2">
              <div className="font-bold">{address}</div>
              <div className="text-sm text-gray-600">
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-aspro rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <span className="text-blue-600 mr-2">
              <MapPin size={20} />
            </span>
            Λεπτομέρειες Εργασίας
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                  <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">{workDetails.status}</div>
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
                    <div className={workDetails.channels ? "font-medium" : "text-gray-400"}>{workDetails.channels ? "ΝΑΙ" : "ΟΧΙ"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Εκσκαφή</div>
                    <div className={workDetails.excavation ? "font-medium" : "text-gray-400"}>{workDetails.excavation ? "ΝΑΙ" : "ΟΧΙ"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Κανάλι</div>
                    <div className={workDetails.conduit ? "font-medium" : "text-gray-400"}>{workDetails.conduit ? "ΝΑΙ" : "ΟΧΙ"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">KYA</div>
                    <div className={workDetails.ftu ? "font-medium" : "text-gray-400"}>{workDetails.ftu ? "ΝΑΙ" : "ΟΧΙ"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Χρήση</div>
                    <div className={workDetails.usage ? "font-medium" : "text-gray-400"}>{workDetails.usage ? "ΝΑΙ" : "ΟΧΙ"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">BMO</div>
                    <div className="font-medium">{workDetails.bmo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">BCP</div>
                    <div className={workDetails.bcp ? "font-medium" : "text-gray-400"}>{workDetails.bcp ? "ΝΑΙ" : "ΟΧΙ"}</div>
                  </div>
                </div>
              </div>
              {workDetails.description && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Περιγραφή</h4>
                  <div className="border p-3 rounded-md bg-gray-50">{workDetails.description}</div>
                </div>
              )}
            </div>
            <div className="space-y-6">
              {/* Replace the static map with the Leaflet map */}
              <div className="h-64 bg-gray-100 rounded-lg overflow-hidden border">
                {workDetails.latitude && workDetails.longitude ? (
                  <MapComponent 
                    location={{ 
                      latitude: workDetails.latitude, 
                      longitude: workDetails.longitude 
                    }} 
                    address={workDetails.address}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <p className="text-gray-700 font-medium">Δεν βρέθηκαν συντεταγμένες</p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-3">Προγραμματισμός</h4>
                <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="text-blue-500 w-5 h-5 mr-3" />
                    <div>
                      <div className="text-sm text-gray-500">Ομάδα:</div>
                      <div className="font-medium">{translateTeamName(workDetails.team)}</div>
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
          <div className="p-8 text-center text-gray-500">Δεν υπάρχουν διαθέσιμες λεπτομέρειες</div>
        )}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Κλείσιμο</button>
        </div>
      </div>
    </div>
  );
};

const MapViewModal = ({ isOpen, onClose, events, onEventClick }: { isOpen: boolean; onClose: () => void; events: Event[]; onEventClick: (event: Event) => void }) => {
  if (!isOpen) return null;

  const eventsWithLocation = events.filter((event) => event.location && event.location.latitude && event.location.longitude);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[9000] flex items-center justify-center backdrop-blur-sm">
      <div className="bg-aspro rounded-lg shadow-lg w-[92%] h-[90%] max-w-6xl max-h-[800px] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            Χάρτης Εργασιών
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors" aria-label="Κλείσιμο">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 relative">
          {eventsWithLocation.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">Δεν υπάρχουν εργασίες με δεδομένα τοποθεσίας</div>
          ) : (
            <div className="h-full bg-gray-100 p-4 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {eventsWithLocation.map((event) => (
                  <div key={event.id} className="bg-aspro p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEventClick(event)}>
                    <div className="flex items-start">
                      <MapPin className="text-blue-500 mr-2 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-gray-600">{event.location?.address || event.area}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(event.start), "dd/MM/yyyy HH:mm", { locale: el })} • {event.technicianName}
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
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">Κλείσιμο</button>
        </div>
      </div>
    </div>
  );
};

const TechnicianEvents = ({ tech, events, currentDate, onEventClick }: { tech: Technician; events: Event[]; currentDate: Date; onEventClick: (event: Event) => void }) => {
  const techEvents = events.filter((event) => event.technicianName === tech.name && isSameDay(new Date(event.start), currentDate));

  const eventLanes: Event[][] = [];
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

    if (assignedLane === -1) assignedLane = Math.min(eventLanes.length, maxLanes - 1);

    if (!eventLanes[assignedLane]) eventLanes[assignedLane] = [];
    eventLanes[assignedLane].push(event);
  });

  const laneHeight = 28;
  const laneSpacing = 4;
  const rowHeight = Math.max(eventLanes.filter((lane) => lane.length > 0).length * (laneHeight + laneSpacing) + 12, 48);

  return (
    <div className="relative h-full" style={{ height: `${rowHeight}px` }}>
      <div className="grid grid-cols-12 h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`h-full ${i < 11 ? "border-r border-gray-100" : ""}`}></div>
        ))}
      </div>
      {sortedEvents.map((event) => {
        const appointmentClass = getTimelineEventStyle(event);
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        const totalMinutesInRange = 12 * 60;
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
        const startMinutesFromRangeStart = Math.max(0, startMinutes - 8 * 60);
        const endMinutesFromRangeStart = Math.min(totalMinutesInRange, endMinutes - 8 * 60);

        const left = (startMinutesFromRangeStart / totalMinutesInRange) * 100;
        const width = ((endMinutesFromRangeStart - startMinutesFromRangeStart) / totalMinutesInRange) * 100;

        if (startDate.getHours() >= 20 || endDate.getHours() < 8) return null;

        const laneIndex = eventLanes.findIndex((lane) => lane.includes(event));
        const top = laneIndex * (laneHeight + laneSpacing) + 6;
        
        // Truncate event name based on duration
        const truncatedName = truncateEventName(event.name, startDate, endDate);

        return (
          <div
            key={event.id}
            className={`absolute rounded-lg shadow-md cursor-pointer transition-all duration-200 ${appointmentClass} border border-white/30 hover:shadow-lg hover:brightness-110 hover:z-50`}
            style={{ left: `${left}%`, width: `${Math.max(width, 5)}%`, height: `${laneHeight}px`, top: `${top}px`, zIndex: laneIndex + 10 }}
            onClick={() => onEventClick(event)}
            title={`${event.name} (${format(startDate, "HH:mm", { locale: el })} - ${format(endDate, "HH:mm", { locale: el })})`}
          >
            <div className="h-full flex items-center px-2 overflow-hidden">
              <span className="text-sm font-medium flex flex-wrap whitespace-nowrap">{truncatedName}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TimelineView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true); // Add state for initial loading
  const [error, setError] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isWorkDetailsOpen, setIsWorkDetailsOpen] = useState(false);
  const [isJobsModalOpen, setIsJobsModalOpen] = useState(false);
  const [openedFromJobsModal, setOpenedFromJobsModal] = useState(false); 
  const [selectedWorkId, setSelectedWorkId] = useState("");
  const [selectedWorkType, setSelectedWorkType] = useState("");
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);

  const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    AUTOPSY: true,
    CONSTRUCTION: true,
    SPLICING: true,
    EARTHWORK: true,
  });
  const [activeTechnicianFilters, setActiveTechnicianFilters] = useState<Record<string, boolean>>({});

  const fetchEventsTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchTechnicians = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Δεν βρέθηκε το token πιστοποίησης");

      const response = await fetch("http://192.168.4.150:8080/api/v1/User", { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
      if (!response.ok) throw new Error(`Αποτυχία φόρτωσης τεχνικών: ${response.status}`);
      const data = await response.json();

      const detailedTechnicians = await Promise.allSettled(data.list.map(async (user: any) => {
        try {
          const detailResponse = await fetch(`http://192.168.4.150:8080/api/v1/User/${user.id}`, { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
          if (!detailResponse.ok) return null;
          const userDetail = await detailResponse.json();
          const teams = Object.values(userDetail.teamsNames || {});
          const normalizedTeams = teams.map((team: string) => team.replace(/\s+/g, " ").trim().toLowerCase());
          const teamMappings: Record<string, string> = { "technicians - construct": "Technicians - Construct", "technicians - splicers": "Technicians - Splicers", "technicians - soil": "Technicians - Soil", autopsy: "Autopsy" };
          let matchedTeam = null;
          for (const normalizedTeam of normalizedTeams) if (teamMappings[normalizedTeam]) { matchedTeam = teamMappings[normalizedTeam]; break; }
          if (!matchedTeam) return null;
          return { id: user.id, name: user.name, team: matchedTeam };
        } catch (error) { return null; }
      }));

      const filteredTechnicians = detailedTechnicians.filter((result) => result.status === "fulfilled" && result.value !== null).map((result: any) => result.value);
      setTechnicians(filteredTechnicians);
    } catch (error) {
      console.error("Σφάλμα φόρτωσης τεχνικών:", error);
      setError("Αποτυχία φόρτωσης τεχνικών. Παρακαλώ δοκιμάστε ξανά.");
    }
    setLoading(false);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Δεν βρέθηκε το token πιστοποίησης");

      const formattedDate = format(currentDate, "yyyy-MM-dd", { locale: el });
      const allEvents: Event[] = [];

      await Promise.all(CONSTRUCTION_API_ENDPOINTS.map(async (endpoint) => {
        const apiSource = endpoint.split("/").pop() || "Unknown";
        try {
          const response = await fetch(`${endpoint}?date=${formattedDate}`, { headers: { Authorization: `Basic ${authToken}`, "Content-Type": "application/json" } });
          if (!response.ok) throw new Error(`Αποτυχία φόρτωσης από ${endpoint}: ${response.status}`);
          const data = await response.json();
          if (data?.list && Array.isArray(data.list)) {
            data.list.forEach((item: any) => {
              if (item.dateStart && item.assignedUserName) {
                const appointmentType = getAppointmentTypeFromEndpoint(apiSource);
                const serverStart = new Date(item.dateStart);
                const serverEnd = item.dateEnd ? new Date(item.dateEnd) : addHours(new Date(item.dateStart), 1);
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
                  area: item.addressCity || item.perioxi || (item.name?.includes(" Δ. ") ? "Δ. " + item.name.split(" Δ. ")[1] : ""),
                  details: item.details || item.description || item.info || item.sxolia,
                  appointmentType,
                  location: (item.addressLatitude && item.addressLongitude) || item.mapsurl ? {
                    latitude: parseFloat(item.addressLatitude || (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[0] : "0")),
                    longitude: parseFloat(item.addressLongitude || (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[1] : "0")),
                    address: item.addressStreet || item.address || item.name || "",
                  } : undefined,
                });
              }
            });
          }
        } catch (error) { console.error(`Σφάλμα φόρτωσης από ${endpoint}:`, error); }
      }));

      allEvents.sort((a, b) => a.technicianName.localeCompare(b.technicianName));
      setEvents(allEvents);
    } catch (error) {
      console.error("Σφάλμα φόρτωσης συμβάντων:", error);
      setError("Αποτυχία φόρτωσης συμβάντων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
      setInitialLoading(false); // Set initial loading to false once events are loaded
    }
  }, [currentDate]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const typeIsActive = !event.appointmentType || activeFilters[event.appointmentType];
      const technicianForEvent = technicians.find((tech) => tech.name === event.technicianName);
      const technicianIsActive = !technicianForEvent?.id || activeTechnicianFilters[technicianForEvent.id];
      return typeIsActive && technicianIsActive;
    });
  }, [events, activeFilters, activeTechnicianFilters, technicians]);

  const getAppointmentTypeFromEndpoint = (endpoint: string) => {
    switch (endpoint) {
      case "CKataskeyastikadates": return "CONSTRUCTION";
      case "CSplicingWork": return "SPLICING";
      case "CEarthWork": return "EARTHWORK";
      case "Test": return "AUTOPSY";
      default: return "CONSTRUCTION";
    }
  };

  const goToPrevious = () => setCurrentDate((prev) => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() - 1); return newDate; });
  const goToNext = () => setCurrentDate((prev) => { const newDate = new Date(prev); newDate.setDate(newDate.getDate() + 1); return newDate; });
  const goToToday = () => setCurrentDate(new Date());
  const handleEventClick = (event: Event, fromJobsModal = false) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
    setOpenedFromJobsModal(fromJobsModal);
    if (!fromJobsModal) setIsJobsModalOpen(false); // Close JobsModal only if not opened from it
  };
  
  const handleEditEvent = (event: Event) => { setSelectedEvent(event); setIsEditModalOpen(true); };
  const handleSaveEvent = async (updatedEvent: Event) => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Δεν βρέθηκε το token πιστοποίησης");
      setEvents((prevEvents) => prevEvents.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
      setIsEditModalOpen(false);
      await fetchEvents();
    } catch (error) {
      console.error("Σφάλμα αποθήκευσης συμβάντος:", error);
      setError("Αποτυχία αποθήκευσης συμβάντος. Παρακαλώ δοκιμάστε ξανά.");
    } finally { setLoading(false); }
  };
  
  const handleViewDetails = async (testRecordId: string, appointmentType?: string) => {
    if (!testRecordId) { alert("Δεν υπάρχει διαθέσιμο test record ID για αυτό το συμβάν."); return; }
    try {
      setSelectedWorkId(testRecordId);
      setSelectedWorkType(appointmentType || "");
      setIsWorkDetailsOpen(true);
      setIsEventDetailOpen(false);
    } catch (error) {
      console.error("Σφάλμα στο handleViewDetails:", error);
      alert("Σφάλμα φόρτωσης λεπτομερειών. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  const filteredTechnicians = useMemo(() => technicians.filter((tech) => {
    const technicianIsActive = activeTechnicianFilters[tech.id];
    const hasEvents = filteredEvents.some((event) => event.technicianName === tech.name && isSameDay(new Date(event.start), currentDate));
    return technicianIsActive && hasEvents;
  }), [technicians, activeTechnicianFilters, filteredEvents, currentDate]);

  const techniciansWithEvents = useMemo(() => {
    const techNames = new Set(filteredEvents.filter((event) => isSameDay(new Date(event.start), currentDate)).map((event) => event.technicianName));
    return filteredTechnicians.filter((tech) => techNames.has(tech.name));
  }, [filteredEvents, currentDate, filteredTechnicians]);

  useEffect(() => {
    if (technicians.length > 0) {
      const initialTechnicianFilters = technicians.reduce((acc, tech) => ({
        ...acc,
        [tech.id]: true,
      }), {});
      setActiveTechnicianFilters(initialTechnicianFilters);
    }
  }, [technicians]);

  useEffect(() => { fetchTechnicians(); }, [fetchTechnicians]);

  useEffect(() => {
    if (fetchEventsTimeout.current) clearTimeout(fetchEventsTimeout.current);
    fetchEventsTimeout.current = setTimeout(() => fetchEvents(), 300);
    return () => { if (fetchEventsTimeout.current) clearTimeout(fetchEventsTimeout.current); };
  }, [currentDate, fetchEvents]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(activeFilters).filter((v) => !v).length +
      Object.values(activeTechnicianFilters).filter((v) => !v).length,
    [activeFilters, activeTechnicianFilters]
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-700">Φόρτωση δεδομένων χρονοδιαγράμματος...</p>
        </div>
      </div>
    );
  }

return (
<div className="flex flex-col h-screen bg-gray-100">
    {/* Main Header - Sticky */}
    <header className="bg-aspro border-b py-3 px-6 shadow-sm sticky top-0 z-40">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Χρονοδιάγραμμα Εργασιών</h1>
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
            onClick={() => setIsJobsModalOpen(true)}
          >
            <MapPin size={18} />
          </button>
        </div>
      </div>
    </header>

    {/* Date Navigation - Sticky Below Header */}
    <div className="bg-aspro border-b py-3 px-6 flex justify-between items-center sticky top-16 z-30">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {format(currentDate, "E d MMM yyyy", { locale: el })}
        </h2>
        <DatePicker
          selected={currentDate}
          onChange={(date: Date) => setCurrentDate(date)}
          dateFormat="dd/MM/yyyy"
          locale={el}
          customInput={
            <button className="p-1.5 rounded-full hover:bg-gray-100">
              <CalendarIcon size={20} />
            </button>
          }
        />
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

    {/* Error Message */}
    {error && (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mx-6 mt-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>{error}</p>
        </div>
        <button onClick={fetchEvents} className="mt-2 text-sm underline">
          Δοκιμάστε ξανά
        </button>
      </div>
    )}

    {/* Timeline Grid - Scrolling Container */}
    <div className="flex-1 p-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 148px)" }}>
      <div className="bg-aspro border rounded-lg shadow-sm overflow-x-auto">
      <div className="w-full">
          {/* Timeslots Header - Sticky Within Scrolling Container */}
          <div className="grid grid-cols-[250px_1fr] border-b sticky top-0 z-20 bg-aspro">
            <div className="p-3 font-medium text-gray-800 border-r bg-gray-50"></div>
            <div className="grid grid-cols-12">
              {timeSlots.slice(0, 12).map((time, index) => (
                <div
                  key={time}
                  className={`p-3 text-center font-medium text-gray-600 bg-gray-50 ${
                    index < 11 ? "border-r" : ""
                  }`}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Technicians and Events */}
          {techniciansWithEvents.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              Δεν υπάρχουν προγραμματισμένα συμβάντα για αυτήν την ημέρα.
            </div>
          ) : (
            techniciansWithEvents.map((tech, index) => (
              <div
                key={tech.id}
                className={`grid grid-cols-[250px_1fr] ${
                  index < techniciansWithEvents.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="p-4 flex items-center space-x-3 border-r bg-aspro">
                  <InitialsAvatar name={tech.name} className="w-8 h-8 text-sm" />
                  <div>
                    <div className="font-medium text-sm">{tech.name}</div>
                    <div className="text-xs text-gray-500">{tech.team}</div>
                  </div>
                </div>
                <TechnicianEvents
                  tech={tech}
                  events={filteredEvents}
                  currentDate={currentDate}
                  onEventClick={handleEventClick}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    {/* Modals and Panels */}
    <FilterPanel
      isOpen={isFilterPanelOpen}
      onClose={() => setIsFilterPanelOpen(false)}
      activeFilters={activeFilters}
      activeTechnicianFilters={activeTechnicianFilters}
      onFilterChange={(filters: Record<string, boolean>) => setActiveFilters(filters)}
      onTechnicianFilterChange={(filters: Record<string, boolean>) =>
        setActiveTechnicianFilters(filters)
      }
      technicians={technicians}
    />
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
    <JobsModal
      isOpen={isJobsModalOpen}
      onClose={() => setIsJobsModalOpen(false)}
      events={filteredEvents}
      onEventClick={(event) => handleEventClick(event, true)}
      currentDate={currentDate} // Pass the actual currentDate state
    />
  </div>
);
};

export default TimelineView;