import { useState, useEffect } from "react";
import api from "@/services/api";

interface ConstructionAppointmentDetail {
  id: string;
  sr: string;
  name: string;
  status: string;
  createdAt: string;
  customerAddress: string;
  customerFloor: string;
  kagkela: string;
  enaeria: string;
  kanali: string;
  startDate: string;
  endDate: string;
  contractor: string;
  bmo: string;
  dyskolia: string;
  kya: string;
  xrewsh: string;
  materials: string[];
  notes: string | null;
  photos: string[];
  [key: string]: any;
}

const parsePhotos = (photosHtml: string): string[] => {
  if (typeof window === 'undefined') return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(photosHtml, "text/html");
  const imageLinks: string[] = [];
  doc.querySelectorAll("a").forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (href) {
      imageLinks.push(href);
    }
  });
  return imageLinks;
};

export function useConstructionAppointment(sr: string) {
  const [data, setData] = useState<ConstructionAppointmentDetail[]>([]);
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
        const cleanSR = sr.trim();
        const maxSize = 50;
        let offset = 0;
        let allData: ConstructionAppointmentDetail[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await api.getConstructionAppointmentBySR(cleanSR, offset, maxSize);
          
          if (response.list && response.list.length > 0) {
            const parsedData = response.list.map((rawData: any) => ({
              ...rawData,
              photos: rawData.photos ? parsePhotos(rawData.photos) : [],
              materials: Array.isArray(rawData.materials) ? rawData.materials : [],
              notes: rawData.notes || null,
              dateStart: rawData.startDate || rawData.dateStart,
              dateEnd: rawData.endDate || rawData.dateEnd,
              assignedUserName: rawData.contractor || rawData.assignedUserName,
            }));
            allData = [...allData, ...parsedData];
            
            if (response.list.length < maxSize) {
              hasMore = false;
            } else {
              offset += maxSize;
            }
          } else {
            hasMore = false;
          }
        }

        setData(allData);
        setError(null);
      } catch (err) {
        console.error("Error fetching construction appointments:", err);
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

export default useConstructionAppointment;