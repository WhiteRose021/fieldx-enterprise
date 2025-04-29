// src/hooks/useAppointment.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';

interface AppointmentDetail {
  id: string;
  name: string;
  status: string;
  dateStart: string;
  dateEnd: string;
  description: string | null;
  assignedUserName?: string;  // Add this for assigned technician
  customerName: string;
  customerMobile: string;
  address: string;
  perioxi: string;
  sxolia: string | null;
  srText: string;  // Add this since we're querying by srText
  [key: string]: any;
}

export function useAppointment(sr: string) {
  const [data, setData] = useState<AppointmentDetail[]>([]);  // Change to array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!sr) {
        setData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.getAppointmentBySR(sr);
        
        if ('error' in response) {
          throw new Error(response.error);
        }

        // Handle the list response
        const appointments = response.list || [];
        setData(appointments);
        setError(null);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sr]);

  return { data, loading, error };
}

// types/appointment.ts (add to existing file)
export interface CreateAppointmentPayload {
  parentId: string;
  parentType: string;
  parentName: string;
  dateStart: string;
  dateEnd: string;
  assignedUserId: string;
  description?: string;
  name: string;
  status: string;
  customername: string;
  customerMobille?: string;
  address: string;
  perioxi: string;
  ttlp: string;
  bid?: string;
}

export default useAppointment;