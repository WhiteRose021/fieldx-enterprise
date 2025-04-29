"use client";

import React, { useState, useMemo, useEffect } from "react";
import { X, MapPin, Locate, Calendar, ChevronLeft, ChevronRight, Filter, Clock, User, Info, Check } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Event } from "./types"; // Make sure to import your Event type
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  format,
  isSameDay,
  isBefore,
  isAfter,
  isWithinInterval
} from 'date-fns';
import { el } from 'date-fns/locale';
import EventDetailModal from './EventDetailModal';

// Fix for Leaflet's default marker icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Filter view types
enum FilterViewType {
  Month = 'month',
  Week = 'week',
  Day = 'day'
}

// Statuses for filtering
type EventStatus = 'ΟΛΟΚΛΗΡΩΣΗ' | 'ΑΠΟΣΤΟΛΗ' | 'ΑΠΟΡΡΙΨΗ' | 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ' | 'default';

const STATUS_FILTERS: Record<EventStatus, { label: string, color: string }> = {
  'ΟΛΟΚΛΗΡΩΣΗ': { label: 'Ολοκληρώθηκε', color: 'bg-emerald-500' },
  'ΑΠΟΣΤΟΛΗ': { label: 'Σε εξέλιξη', color: 'bg-blue-500' },
  'ΑΠΟΡΡΙΨΗ': { label: 'Απορρίφθηκε', color: 'bg-yellow-500' },
  'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': { label: 'Μη ολοκληρωμένο', color: 'bg-red-500' },
  'default': { label: 'Προγραμματισμένο', color: 'bg-gray-500' }
};

// Custom marker icons based on appointment type
const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px ${color}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const appointmentTypeIcons = {
  'CONSTRUCTION': createCustomIcon('#10b981'), // green
  'SPLICING': createCustomIcon('#3b82f6'), // blue
  'EARTHWORK': createCustomIcon('#f59e0b'), // orange/yellow
  'AUTOPSY': createCustomIcon('#8b5cf6'), // purple
};

// Status icons for markers
const statusIcons = {
  'ΟΛΟΚΛΗΡΩΣΗ': createCustomIcon('#10b981'), // emerald/green
  'ΑΠΟΣΤΟΛΗ': createCustomIcon('#3b82f6'), // blue
  'ΑΠΟΡΡΙΨΗ': createCustomIcon('#eab308'), // yellow
  'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': createCustomIcon('#ef4444'), // red
  'default': createCustomIcon('#6b7280'), // gray
};

// Map bounds controller component
const MapBoundsController = ({ markers }: { markers: { lat: number, lng: number }[] }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(marker => [marker.lat, marker.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Default center on Athens with zoom level 14 (more zoomed in)
      // Adjusted coordinates to be lower on vertical axis (37.97 instead of 37.98)
      map.setView([37.97, 23.73], 14);
    }
  }, [map, markers]);
  
  return null;
};

// Map center control
const MapCenterControl = ({ markers }: { markers: { lat: number, lng: number }[] }) => {
  const map = useMap();
  
  const handleCenterMap = () => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(marker => [marker.lat, marker.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      // Default center on Athens with adjusted coordinates and zoom
      map.setView([37.97, 23.73], 14);
    }
  };
  
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '70px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button 
          className="flex items-center justify-center bg-aspro text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-md shadow-md border border-blue-400 transition-colors duration-200"
          onClick={handleCenterMap}
          title="Επαναφορά χάρτη στο κέντρο"
        >
          <Locate size={16} />
        </button>
      </div>
    </div>
  );
};

// Get appointment type label in Greek
const getAppointmentTypeLabel = (type?: string): string => {
  switch (type) {
    case 'CONSTRUCTION': return 'Κατασκευές';
    case 'SPLICING': return 'Κολλήσεις';
    case 'EARTHWORK': return 'Χωματουργικά';
    case 'AUTOPSY': return 'Αυτοψίες';
    default: return 'Άλλο';
  }
};

interface MapViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: Event[];
  onEventClick: (event: Event) => void;
  onViewDetails: (testRecordId: string, appointmentType?: string) => Promise<void>;
}

const MapViewModal: React.FC<MapViewModalProps> = ({
  isOpen,
  onClose,
  events,
  onEventClick,
  onViewDetails
}) => {
  // State for filter view type and date
  const [filterViewType, setFilterViewType] = useState<FilterViewType>(FilterViewType.Month);
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  
  // State for status filters
  const [statusFilters, setStatusFilters] = useState<Record<EventStatus, boolean>>({
    'ΟΛΟΚΛΗΡΩΣΗ': true,
    'ΑΠΟΣΤΟΛΗ': true,
    'ΑΠΟΡΡΙΨΗ': true,
    'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': true,
    'default': true
  });
  
  // State for showing status filter panel
  const [showStatusFilters, setShowStatusFilters] = useState<boolean>(false);
  
  // State for internal event detail modal
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState<boolean>(false);
  
  // Get date range based on filter type
  const getDateRange = (): { start: Date, end: Date } => {
    switch (filterViewType) {
      case FilterViewType.Month:
        return {
          start: startOfMonth(filterDate),
          end: endOfMonth(filterDate)
        };
      case FilterViewType.Week:
        return {
          start: startOfWeek(filterDate, { weekStartsOn: 1 }), // Start week on Monday
          end: endOfWeek(filterDate, { weekStartsOn: 1 })
        };
      case FilterViewType.Day:
        return {
          start: startOfDay(filterDate),
          end: endOfDay(filterDate)
        };
    }
  };
  
  // Navigate to previous/next period
  const goToPrevious = () => {
    switch (filterViewType) {
      case FilterViewType.Month:
        setFilterDate(subMonths(filterDate, 1));
        break;
      case FilterViewType.Week:
        setFilterDate(subWeeks(filterDate, 1));
        break;
      case FilterViewType.Day:
        setFilterDate(subDays(filterDate, 1));
        break;
    }
  };
  
  const goToNext = () => {
    switch (filterViewType) {
      case FilterViewType.Month:
        setFilterDate(addMonths(filterDate, 1));
        break;
      case FilterViewType.Week:
        setFilterDate(addWeeks(filterDate, 1));
        break;
      case FilterViewType.Day:
        setFilterDate(addDays(filterDate, 1));
        break;
    }
  };
  
  // Format the filter title based on view type
  const getFilterTitle = (): string => {
    switch (filterViewType) {
      case FilterViewType.Month:
        return format(filterDate, 'MMMM yyyy', { locale: el });
      case FilterViewType.Week:
        const weekStart = startOfWeek(filterDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(filterDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: el })} - ${format(weekEnd, 'd MMM yyyy', { locale: el })}`;
      case FilterViewType.Day:
        return format(filterDate, 'EEEE, d MMMM yyyy', { locale: el });
    }
  };
  
  // Toggle status filter
  const toggleStatusFilter = (status: EventStatus) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };
  
  // Select all/none status filters
  const selectAllStatuses = () => {
    const newFilters = {} as Record<EventStatus, boolean>;
    Object.keys(statusFilters).forEach(key => {
      newFilters[key as EventStatus] = true;
    });
    setStatusFilters(newFilters);
  };
  
  const selectNoneStatuses = () => {
    const newFilters = {} as Record<EventStatus, boolean>;
    Object.keys(statusFilters).forEach(key => {
      newFilters[key as EventStatus] = false;
    });
    setStatusFilters(newFilters);
  };
  
  // Filter events based on date range and status
  const filteredEvents = useMemo(() => {
    const dateRange = getDateRange();
    
    return events.filter(event => {
      // Date filter
      const eventDate = new Date(event.start);
      const isInDateRange = isWithinInterval(eventDate, { 
        start: dateRange.start, 
        end: dateRange.end 
      });
      
      // Status filter - default to 'default' if no status
      const eventStatus = event.status || 'default';
      const passesStatusFilter = statusFilters[eventStatus as EventStatus];
      
      return isInDateRange && passesStatusFilter;
    });
  }, [events, filterViewType, filterDate, statusFilters]);
  
  // Filter events to only include those with location data
  const eventsWithLocation = useMemo(() => 
    filteredEvents.filter(event => 
      event.location && 
      event.location.latitude && 
      event.location.longitude
    ),
  [filteredEvents]);

  // Format date for display
  const formatDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy', { locale: el });
  };

  // Prepare map markers from events
  const mapMarkers = useMemo(() => 
    eventsWithLocation.map(event => ({
      lat: event.location!.latitude,
      lng: event.location!.longitude,
      label: event.location!.address || event.area || event.name,
      event,
    })),
  [eventsWithLocation]);
  
  // Get active filter count
  const activeFilterCount = useMemo(() => 
    Object.values(statusFilters).filter(v => !v).length, 
  [statusFilters]);
  
  // Handle event click from map - use internal modal instead of external
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDetailOpen(true);
  };
  
  // Handle closing the event detail modal
  const handleCloseEventDetail = () => {
    setIsEventDetailOpen(false);
    setSelectedEvent(null);
  };
  
  // Handle view details and propagate to parent
  const handleViewDetails = async (testRecordId: string, appointmentType?: string) => {
    // Close the event detail modal first
    setIsEventDetailOpen(false);
    
    // Propagate to parent to open the work details modal
    await onViewDetails(testRecordId, appointmentType);
  };

  if (!isOpen) return null;

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
        
        {/* Date and Status Filters */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2">
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  filterViewType === FilterViewType.Month 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilterViewType(FilterViewType.Month)}
              >
                Μήνας
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  filterViewType === FilterViewType.Week 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilterViewType(FilterViewType.Week)}
              >
                Εβδομάδα
              </button>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  filterViewType === FilterViewType.Day 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilterViewType(FilterViewType.Day)}
              >
                Ημέρα
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200"
              >
                <ChevronLeft size={16} />
              </button>
              
              <span className="text-gray-700 font-medium">
                {getFilterTitle()}
              </span>
              
              <button
                onClick={goToNext}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200"
              >
                <ChevronRight size={16} />
              </button>
              
              <button
                onClick={() => setFilterDate(new Date())}
                className="ml-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md flex items-center gap-1"
                title="Σήμερα"
              >
                <Calendar size={14} />
                Σήμερα
              </button>
            </div>
            
            <div className="flex gap-2 items-center">
              <button 
                className="relative bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1"
                onClick={() => setShowStatusFilters(!showStatusFilters)}
              >
                <Filter size={14} />
                Κατάσταση
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              
              <div className="text-xs text-gray-500">
                {eventsWithLocation.length} από {filteredEvents.length} εργασίες
              </div>
            </div>
          </div>
          
          {/* Status Filters Panel */}
          {showStatusFilters && (
            <div className="mt-3 p-3 bg-white rounded-md border shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Φίλτρα Κατάστασης</h3>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={selectAllStatuses}
                  >
                    Επιλογή όλων
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-800"
                    onClick={selectNoneStatuses}
                  >
                    Κανένα
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_FILTERS).map(([status, { label, color }]) => (
                  <div 
                    key={status}
                    className={`px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-2 ${
                      statusFilters[status as EventStatus] ? 'bg-gray-100' : 'bg-gray-50 opacity-60'
                    }`}
                    onClick={() => toggleStatusFilter(status as EventStatus)}
                  >
                    <div className={`w-3 h-3 rounded-full ${color}`}></div>
                    <span className="text-sm">{label}</span>
                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                      statusFilters[status as EventStatus] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {statusFilters[status as EventStatus] && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          {eventsWithLocation.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Δεν υπάρχουν εργασίες με δεδομένα τοποθεσίας για την επιλεγμένη περίοδο
            </div>
          ) : (
            <div className="h-full">
              <MapContainer
                center={[37.97, 23.73]} // Adjusted Athens coordinates
                zoom={14} // Higher zoom level
                style={{ height: "100%", width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                  attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>'
                />
                {mapMarkers.map((marker, index) => (
                  <Marker 
                    key={`${marker.event.id}-${index}`} 
                    position={[marker.lat, marker.lng]}
                    icon={marker.event?.status 
                      ? statusIcons[marker.event.status as EventStatus] || statusIcons.default 
                      : statusIcons.default
                    }
                    eventHandlers={{
                      click: () => {
                        if (marker.event) {
                          handleEventClick(marker.event);
                        }
                      }
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent={false}>
                      <div className="p-2 rounded text-sm">
                        <div className="font-bold">{marker.label}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            marker.event?.status 
                              ? STATUS_FILTERS[marker.event.status as EventStatus]?.color || STATUS_FILTERS.default.color
                              : STATUS_FILTERS.default.color
                          }`}></div>
                          <span className="text-gray-700">
                            {marker.event?.status 
                              ? STATUS_FILTERS[marker.event.status as EventStatus]?.label || STATUS_FILTERS.default.label
                              : STATUS_FILTERS.default.label
                            }
                          </span>
                        </div>
                        {marker.event?.appointmentType && (
                          <div className="text-gray-700 mt-1">{getAppointmentTypeLabel(marker.event.appointmentType)}</div>
                        )}
                        {marker.event?.sr && (
                          <div className="text-gray-600 mt-1">SR: {marker.event.sr}</div>
                        )}
                        <div className="text-xs mt-1 text-blue-600">
                          Τεχνικός: {marker.event?.technicianName}<br/>
                          Ημ/νία: {formatDate(new Date(marker.event?.start))}<br/>
                          Ώρα: {format(new Date(marker.event?.start), 'HH:mm')} - {format(new Date(marker.event?.end), 'HH:mm')}
                        </div>
                      </div>
                    </Tooltip>
                  </Marker>
                ))}
                <MapBoundsController markers={mapMarkers} />
                <MapCenterControl markers={mapMarkers} />
              </MapContainer>
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
      
      {/* Event Detail Modal that appears on top of the map */}
      {selectedEvent && (
        <EventDetailModal
          isOpen={isEventDetailOpen}
          onClose={handleCloseEventDetail}
          event={selectedEvent}
          onViewDetails={handleViewDetails}
          onEdit={undefined} // We don't need edit functionality from the map view
        />
      )}
    </div>
  );
};

export default MapViewModal;