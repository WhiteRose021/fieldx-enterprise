// src/hooks/useTechnicalCheck.ts
import { useState, useEffect } from 'react';
import api from '@/services/api';

interface TechnicalCheckDetail {
  id: string;
  name: string;
  state: string;
  customerMobile: string;
  customerAddress: string;
  perioxi: string;
  sr: string;
  cordX: string;
  cordY: string;
  [key: string]: any;
}

export function useTechnicalCheck(sr: string) {
  const [data, setData] = useState<TechnicalCheckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await api.getTechnicalCheck(sr);
        
        if ('error' in response) {
          throw new Error(response.error);
        }

        // Get the first item from the list if it exists
        const checkData = response.list && response.list.length > 0 
          ? response.list[0] 
          : null;

        setData(checkData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (sr) {
      fetchData();
    }
  }, [sr]);

  return { data, loading, error };
}

export default useTechnicalCheck;