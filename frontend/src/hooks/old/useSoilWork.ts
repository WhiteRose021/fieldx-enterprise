import { useState, useEffect } from "react";
import api from "@/services/api";

interface SoilWorkDetail {
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

export function useSoilWork(sr: string) {
  const [data, setData] = useState<SoilWorkDetail | null>(null);
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
        let allData: SoilWorkDetail[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await api.getSoilWorkBySR(cleanSR, offset, maxSize);

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

        setData(allData.length > 0 ? allData[0] : null); // Set only the first item
        setError(null);
      } catch (err) {
        console.error("Error fetching soil work data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setData(null); // Set to null instead of empty array
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sr]);

  return { data, loading, error };
}

export default useSoilWork;