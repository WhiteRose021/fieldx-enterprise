// src/hooks/useAutopsy.ts

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface AutopsyDetail {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  description: string | null;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  adminName: string;
  adminMobile: string;
  adminNumber: string;
  adminEmail: string;
  aDDRESSStreet: string;
  aDDRESSCity: string;
  aDDRESSPostalCode: string | null;
  tTLP: string;
  cATEGORY: string;
  sxolia: string | null;
  latitude: string;
  longitude: string;
  [key: string]: any;
}

export function useAutopsy(id: string) {
  const [data, setData] = useState<AutopsyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await api.getAutopsy(id);
        
        if ('error' in response) {
          throw new Error(response.error);
        }

        setData(response as AutopsyDetail);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchData();
    }
  }, [id]);

  return { data, loading, error };
}

export default useAutopsy;