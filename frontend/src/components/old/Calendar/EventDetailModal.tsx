"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Calendar, Clock, User, Users, ExternalLink, Briefcase } from "lucide-react";
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { Event } from "./types";
import { useRouter } from 'next/navigation';
import { useAutopsyNavigation } from '@/hooks/useAutopsyNavigation';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Appointment type labels and translations
const APPOINTMENT_TYPE_LABELS = {
  AUTOPSY: "Αυτοψίες",
  CONSTRUCTION: "Κατασκευές",
  SPLICING: "Κολλήσεις",
  EARTHWORK: "Χωματουργικά",
};

// Background colors for job sections with associated color values
const APPOINTMENT_TYPE_STYLES = {
  AUTOPSY: { bg: "bg-purple-50 border-purple-100", color: "#9333ea" },
  CONSTRUCTION: { bg: "bg-green-50 border-green-100", color: "#16a34a" },
  SPLICING: { bg: "bg-blue-50 border-blue-100", color: "#2563eb" },
  EARTHWORK: { bg: "bg-orange-50 border-orange-100", color: "#f97316" },
};

// Function to get status display with styling
const getStatusDisplay = (status?: string): { text: string, color: string } => {
  if (!status) return { text: "Προγραμματισμένο", color: "text-blue-700 bg-blue-50 border-blue-200" };

  switch (status) {
    case 'ΟΛΟΚΛΗΡΩΣΗ':
      return { text: "Ολοκληρώθηκε", color: "text-green-700 bg-green-50 border-green-200" };
    case 'ΑΠΟΣΤΟΛΗ':
      return { text: "Σε εξέλιξη", color: "text-purple-700 bg-purple-50 border-purple-200" };
    case 'ΑΠΟΡΡΙΨΗ':
      return { text: "Απορρίφθηκε", color: "text-yellow-700 bg-yellow-50 border-yellow-200" };
    case 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ':
      return { text: "Μη ολοκληρωμένο", color: "text-red-700 bg-red-50 border-red-200" };
    case 'ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ':
      return { text: "Προγραμματισμένο", color: "text-blue-700 bg-blue-50 border-blue-200" };
    default:
      return { text: "Προγραμματισμένο", color: "text-gray-700 bg-gray-50 border-gray-200" };
  }
};

// Fallback map component when Leaflet isn't ready
const StaticMap = ({ location }) => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50">
    <div className="mb-4">
      <div className="relative flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-red-500 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-red-500"></div>
          </div>
        </div>
        <div className="w-5 h-5 bg-red-500 rotate-45 mt-1"></div>
      </div>
    </div>
    <div className="text-center mt-2">
      <p className="text-gray-900 font-medium">{location.address}</p>
      <p className="text-gray-500 text-sm mt-1">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
    </div>
  </div>
);

// MapComponent that uses Leaflet
const LeafletMap = ({ location, appointmentColor }) => {
  const [L, setL] = useState(null);
  const [icon, setIcon] = useState(null);

  useEffect(() => {
    import('leaflet').then(leaflet => {
      setL(leaflet);
      
      // Fix icon default path issues
      delete leaflet.Icon.Default.prototype._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      
      // Create custom icon
      const customIcon = leaflet.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${appointmentColor}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px ${appointmentColor}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });
      
      setIcon(customIcon);
    });
  }, [appointmentColor]);

  if (!L || !icon) {
    return <StaticMap location={location} />;
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>'
        />
        <Marker 
          position={[location.latitude, location.longitude]} 
          icon={icon}
        >
          <Popup>
            <div className="p-2">
              <div className="font-bold">{location.address}</div>
              <div className="text-sm">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </>
  );
};

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  technicianName?: string;
  onViewDetails?: (testRecordId: string, appointmentType?: string) => Promise<void>;
  onEdit?: (event: Event) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  event, 
  technicianName, 
  onEdit 
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { navigateToAutopsy } = useAutopsyNavigation();
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag on component mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isOpen || !event) return null;
  
  // Date formatting
  const formattedDate = format(new Date(event.start), 'dd/MM/yyyy', { locale: el });
  const formattedStartTime = format(new Date(event.start), 'HH:mm');
  const formattedEndTime = format(new Date(event.end), 'HH:mm');
  const timeSlot = `${formattedStartTime} - ${formattedEndTime}`;

  // Status display
  const statusInfo = getStatusDisplay(event.status);

  // Calculate duration in hours
  const durationMs = new Date(event.end).getTime() - new Date(event.start).getTime();
  const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 10) / 10;

  // Navigate to detailed page
  const handleNavigateToDetails = async () => {
    if (!event) return;
    
    setLoading(true);
  
    try {
      // If AUTOPSY, direct navigation
      if (event.appointmentType === 'AUTOPSY') {
        console.log("Direct navigation for AUTOPSY job to:", event.id);
        router.push(`/FTTHBPhase/Autopsies/${event.id}`);
        setLoading(false);
        return;
      }
      
      // Determine the API source based on appointment type
      const apiSourceMap = {
        'CONSTRUCTION': 'CKataskeyastikadates',
        'SPLICING': 'CSplicingWork',
        'EARTHWORK': 'CEarthWork',
        'AUTOPSY': 'Test'
      };
      
      const apiSource = apiSourceMap[event.appointmentType || 'AUTOPSY'] || 'Test';
      const recordId = event.testRecordId || event.id;
      
      // Navigate using the autopsyNavigation hook
      await navigateToAutopsy({ 
        id: recordId, 
        apiSource 
      });
    } catch (error) {
      console.error("Error in handleNavigateToDetails:", error);
      alert('Σφάλμα κατά τη μετάβαση στις λεπτομέρειες. Παρακαλώ προσπαθήστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  // Determine job type category for styling
  const appointmentType = event.appointmentType || 'CONSTRUCTION';
  const categoryClass = APPOINTMENT_TYPE_STYLES[appointmentType]?.bg || 'bg-gray-50 border-gray-200';
  const appointmentColor = APPOINTMENT_TYPE_STYLES[appointmentType]?.color || '#808080';

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-aspro rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase size={20} className="text-blue-600" />
            Λεπτομέρειες Εργασίας
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Κλείσιμο"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          <div>
            {/* Job Title and basic info */}
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{event.name}</h3>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">SR</span>
                  <span className="text-sm font-medium">{event.sr || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Περιοχή</span>
                  <span className="text-sm font-medium">{event.area || 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Τύπος</span>
                  <span className="text-xs inline-block px-2 py-0.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200">
                    {APPOINTMENT_TYPE_LABELS[appointmentType] || "Άλλο"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Κατάσταση</span>
                  <span className={`text-xs inline-block px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Job Details */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-800 mb-3">Στοιχεία Εργασίας</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Είδος Εργασίας</span>
                  <span className="text-sm font-medium">{APPOINTMENT_TYPE_LABELS[appointmentType]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">Εκτιμώμενες Ώρες</span>
                  <span className="text-sm font-medium">{durationHours}</span>
                </div>
              </div>
            </div>
            
            {/* Description and notes */}
            {event.details && (
              <div className="mt-4">
                <h4 className="text-xs text-gray-500 mb-1">Περιγραφή</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200">
                  {event.details}
                </p>
              </div>
            )}
            
            {/* Schedule information */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-800 mb-3">Προγραμματισμός</h4>
              <div className={`p-3 rounded-md border ${categoryClass}`}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Τεχνικός: {technicianName || event.technicianName || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Ημ/νία: {formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-blue-600" />
                    <span className="text-sm text-gray-700">Ώρα: {timeSlot}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map */}
          <div className="h-full min-h-[320px] mt-4 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">{/* Added mt-4 to move it down a bit */}
            {event.location ? (
              isClient ? (
                <LeafletMap 
                  location={event.location} 
                  appointmentColor={appointmentColor} 
                />
              ) : (
                <StaticMap location={event.location} />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <MapPin className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">Δεν βρέθηκαν συντεταγμένες</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 mr-3 transition-colors"
          >
            Κλείσιμο
          </button>
          
          {/* Navigation Button to Details Page */}
          {(event.testRecordId || event.id) && (
            <button
              onClick={handleNavigateToDetails}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center transition-colors"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white rounded-full border-t-transparent"></span>
                  Μετάβαση...
                </span>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Αναλυτικές Πληροφορίες
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;