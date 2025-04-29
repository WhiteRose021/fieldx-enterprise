// types.ts
export type EventStatus = 'ΟΛΟΚΛΗΡΩΣΗ' | 'ΑΠΟΣΤΟΛΗ' | 'ΑΠΟΡΡΙΨΗ' | 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ' | 'default';

export type AppointmentType = 'CONSTRUCTION' | 'SPLICING' | 'EARTHWORK' | 'AUTOPSY';

export interface Event {
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
  details?: string; // Made optional
  status?: EventStatus; // Using the specific type
  rowPosition?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  }
}

export interface Technician {
  id: string;
  name: string;
  team: string;
}

export interface APIOption {
  id: AppointmentType;
  name: string;
  endpoint: string;
  team: string;
}

export interface SelectedAppointment {
  type: AppointmentType;
  technicians: Technician[];
}

export interface APISelectorProps {
  selectedAppointments: AppointmentType[];
  onAppointmentChange: (appointments: AppointmentType[]) => void;
}

export enum CalendarView {
  Day = 'day',
  Week = 'week',
  Month = 'month'
}