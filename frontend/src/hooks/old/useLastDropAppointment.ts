import { useState, useEffect } from 'react';
import api from '@/services/api';
import { LastDropAppointmentPayload } from '@/types/appointment';

export function useLastDropAppointment(sr: string) {
  const [data, setData] = useState<LastDropAppointmentPayload[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        if (!sr) {
          setData([]);
          return;
        }
        
        const response = await api.getLastDropAppointments(sr);
        
        // Safely handle the response
        if (response && 'list' in response && Array.isArray(response.list)) {
          setData(response.list);
        } else {
          setData([]);
        }
        
        setError(null);
      } catch (err) {
        console.error("Error fetching LastDrop appointments:", err);
        setError(typeof err === 'object' && err !== null && 'message' in err 
          ? String(err.message) 
          : 'An error occurred fetching LastDrop appointments');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sr]);

  return { data, loading, error };
}

export default useLastDropAppointment;