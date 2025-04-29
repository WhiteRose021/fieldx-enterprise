// src/components/Calendar/EventDetailModal.tsx
import React from 'react';
import { format } from 'date-fns';
import { el } from 'date-fns/locale';
import { X, MapPin, User, Calendar, Clock, FileText, ChevronLeft, Edit, ExternalLink } from 'lucide-react';
import { TimelineEvent, AppointmentType } from '../../services/timelineService';

// Define mapping of appointment types to a nice readable label (Greek)
export const APPOINTMENT_TYPE_LABELS: Record<string, string> = {
  AUTOPSY: "Αυτοψία",
  CONSTRUCTION: "Κατασκευή",
  SPLICING: "Συγκόλληση",
  EARTHWORK: "Χωματουργικά"
};

// Define mapping for status styles
export const STATUS_STYLES: Record<string, string> = {
  "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-100 text-green-800 border-green-300",
  "ΑΠΟΣΤΟΛΗ": "bg-blue-100 text-blue-800 border-blue-300",
  "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ": "bg-purple-100 text-purple-800 border-purple-300",
  "ΑΠΟΡΡΙΨΗ": "bg-red-100 text-red-800 border-red-300",
  "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-orange-100 text-orange-800 border-orange-300",
  "default": "bg-gray-100 text-gray-800 border-gray-300"
};

interface EventDetailModalProps {
  event: TimelineEvent;
  isOpen: boolean;
  onClose: () => void;
  onViewDetails: (recordId: string, appointmentType?: AppointmentType) => void;
  onEdit: (event: TimelineEvent) => void;
  technicianName?: string;
  showBackToJobs?: boolean;
  onBackToJobs?: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onViewDetails,
  onEdit,
  technicianName,
  showBackToJobs = false,
  onBackToJobs
}) => {
  if (!isOpen) return null;

  // Get the appropriate status style
  const statusStyle = event.status 
    ? STATUS_STYLES[event.status] || STATUS_STYLES.default
    : STATUS_STYLES.default;

  // Format dates
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  const formattedDate = format(startDate, 'EEEE, d MMMM yyyy', { locale: el });
  const formattedStartTime = format(startDate, 'HH:mm', { locale: el });
  const formattedEndTime = format(endDate, 'HH:mm', { locale: el });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      <div className="bg-aspro rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            {showBackToJobs && onBackToJobs && (
              <button 
                onClick={onBackToJobs}
                className="mr-3 hover:bg-blue-700 p-1 rounded"
                aria-label="Back to jobs"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <h3 className="font-medium">
              {APPOINTMENT_TYPE_LABELS[event.appointmentType as keyof typeof APPOINTMENT_TYPE_LABELS] || 'Ραντεβού'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <h2 className="text-xl font-bold mb-4">{event.name}</h2>
          
          <div className="space-y-4">
            {/* Status badge */}
            {event.status && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${statusStyle}`}>
                {event.status}
              </div>
            )}
            
            {/* SR Number */}
            {event.sr && (
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">SR</p>
                  <p className="font-medium">{event.sr}</p>
                </div>
              </div>
            )}
            
            {/* Technician */}
            <div className="flex items-start">
              <User className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Τεχνικός</p>
                <p className="font-medium">{technicianName || event.technicianName}</p>
              </div>
            </div>
            
            {/* Date */}
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Ημερομηνία</p>
                <p className="font-medium capitalize">{formattedDate}</p>
              </div>
            </div>
            
            {/* Time */}
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-500">Ώρα</p>
                <p className="font-medium">{formattedStartTime} - {formattedEndTime}</p>
              </div>
            </div>
            
            {/* Area */}
            {event.area && (
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Περιοχή</p>
                  <p className="font-medium">{event.area}</p>
                </div>
              </div>
            )}
            
            {/* Details */}
            {event.details && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Λεπτομέρειες</p>
                <div className="p-3 bg-gray-50 rounded-md border text-sm">
                  {event.details}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t p-4 bg-gray-50 flex justify-between">
          <div>
            <button 
              onClick={() => event.testRecordId && onViewDetails(event.testRecordId, event.appointmentType)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              disabled={!event.testRecordId}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Λεπτομέρειες Εργασίας
            </button>
          </div>
          <div>
            <button 
              onClick={() => onEdit(event)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Επεξεργασία
            </button>
            <button 
              onClick={onClose} 
              className="ml-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Κλείσιμο
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;