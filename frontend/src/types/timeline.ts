// src/types/timeline.ts
import { AppointmentType, Technician, TimelineEvent, WorkDetails } from '../services/timelineService';

export type { AppointmentType, Technician, TimelineEvent, WorkDetails };

// Event status types
export type EventStatus = 'ΟΛΟΚΛΗΡΩΣΗ' | 'ΑΠΟΣΤΟΛΗ' | 'ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ' | 'ΑΠΟΡΡΙΨΗ' | 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ';

// Define the order of appointment types for consistent display across the app
export const APPOINTMENT_TYPE_ORDER: AppointmentType[] = ['AUTOPSY', 'CONSTRUCTION', 'SPLICING', 'EARTHWORK'];

// Labels for appointment types (displayed to users)
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  AUTOPSY: "Αυτοψία",
  CONSTRUCTION: "Κατασκευή",
  SPLICING: "Συγκόλληση",
  EARTHWORK: "Χωματουργικά"
};

// Team name translations
export const TEAM_NAME_TRANSLATIONS: Record<string, string> = {
  "Technicians - Construct": "Τεχνικοί - Κατασκευή",
  "Technicians - Splicers": "Τεχνικοί - Συγκόλληση",
  "Technicians - Soil": "Τεχνικοί - Χωματουργικά",
  "Autopsy": "Αυτοψία"
};

// Map team names to appointment types
export const TEAM_TO_APPOINTMENT_TYPE: Record<string, AppointmentType> = {
  "Technicians - Construct": "CONSTRUCTION",
  "Technicians - Splicers": "SPLICING",
  "Technicians - Soil": "EARTHWORK",
  "Autopsy": "AUTOPSY"
};

// Background colors for appointment types (subtle, for UI display)
export const APPOINTMENT_TYPE_COLORS: Record<AppointmentType, string> = {
  AUTOPSY: "bg-blue-50 border-blue-200",
  CONSTRUCTION: "bg-green-50 border-green-200",
  SPLICING: "bg-purple-50 border-purple-200",
  EARTHWORK: "bg-amber-50 border-amber-200"
};

// Timeline event styles (for the event blocks in timeline)
export const TIMELINE_EVENT_STYLES: Record<AppointmentType | 'default', string> = {
  AUTOPSY: "bg-blue-500 text-white",
  CONSTRUCTION: "bg-green-500 text-white",
  SPLICING: "bg-purple-500 text-white",
  EARTHWORK: "bg-amber-500 text-white",
  default: "bg-gray-500 text-white"
};

// Status-based event styles (color coding for event status)
export const STATUS_EVENT_STYLES: Record<EventStatus, string> = {
  "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-500 text-white",
  "ΑΠΟΣΤΟΛΗ": "bg-blue-500 text-white",
  "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ": "bg-purple-500 text-white",
  "ΑΠΟΡΡΙΨΗ": "bg-red-500 text-white",
  "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-orange-500 text-white"
};