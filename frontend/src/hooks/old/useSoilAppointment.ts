import { useState, useEffect } from "react";
import api from "@/services/api";

interface SoilWorkAppointmentDetail {
  id: string;
  sr: string;
  name: string;
  status: string;
  createdAt: string;
  customerAddress: string;
  customerMobile: string;
  supervisorName: string;
  excavationDate: string | null;
  period: string;
  contractor: string;
  worker: string | null;
  workerMobile: string | null;
  comments: string | null;
  [key: string]: any; // Allow additional fields
}

export function useSoilAppointment(sr: string) {
  const [data, setData] = useState<SoilWorkAppointmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!sr) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const cleanSR = sr.trim(); // Remove any extra whitespace
        const maxSize = 50;
        let offset = 0;
        let allData: SoilWorkAppointmentDetail[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await api.getSoilAppointmentBySR(cleanSR, offset, maxSize);

          if (response.list && response.list.length > 0) {
            // Normalize the response data if needed
            const parsedData = response.list.map((rawData: any) => ({
              ...rawData,
              excavationDate: rawData.excavationDate || null,
              comments: rawData.comments || null,
              worker: rawData.worker || null,
              workerMobile: rawData.workerMobile || null,
            }));
            allData = [...allData, ...parsedData];
            offset += maxSize;
          } else {
            hasMore = false;
          }
        }

        setData(allData);
        setError(null);
      } catch (err) {
        console.error("Error fetching soil work data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sr]);

  return { data, loading, error };
}

export default useSoilAppointment;
