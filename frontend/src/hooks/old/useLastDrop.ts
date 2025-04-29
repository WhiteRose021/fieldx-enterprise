// src/hooks/useLastDrop.ts

import { useState, useEffect } from 'react';
import api from '@/services/api';

interface LastDropDetail {
  id: string;
  name: string;
  deleted: boolean;
  description: string | null;
  createdAt: string;
  modifiedAt: string;
  cATEGORY: string;
  orderNumber: string;
  pILOT: string;
  aK: string;
  customerName: string;
  customerMobile: string;
  customerNumber: string;
  customerMail: string | null;
  adminName: string | null;
  adminMobile: string | null;
  adminNumber: string | null;
  adminMail: string | null;
  bUILDINGID: string;
  dimos: string;
  cAB: string;
  addressCAB: string | null;
  ttlp: string;
  fIELDTASKSTATUS: string;
  fIELDTASKTYPE: string;
  fLDINCOMPLETEREASON: string | null;
  age: string | null;
  presp: string | null;
  eKSOSISTIMIKISTATE: string | null;
  portInFLAG: string | null;
  oldflow: string | null;
  newflow: string | null;
  floor: string | null;
  coordx: string | null;
  coordy: string | null;
  sr: string | null;
  mulak: string | null;
  fLOOR: string | null;
  aDDRESSStreet: string;
  aDDRESSCity: string | null;
  aDDRESSState: string | null;
  aDDRESSCountry: string | null;
  aDDRESSPostalCode: string | null;
  createdById: string;
  createdByName: string;
  modifiedById: string;
  modifiedByName: string;
  assignedUserId: string;
  assignedUserName: string;
  teamsIds: string[];
  teamsNames: Record<string, string>;
  versionNumber: number;
  // Add any additional fields that might be relevant
  dateStart?: string;
  dateEnd?: string;
  mapsurl?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
  [key: string]: any;
}

export function useLastDrop(id: string) {
  const [data, setData] = useState<LastDropDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await api.getLastDrop(id);
        
        if ('error' in response) {
          throw new Error(response.error);
        }

        setData(response as LastDropDetail);
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

export default useLastDrop;