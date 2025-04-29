import { useState, useEffect } from "react";
import api from "@/services/api";

interface ConstructionDetail {
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
  photos: string[]; // Array of image URLs
  [key: string]: any; // Allow additional fields
}

// Helper function to parse photos HTML string into an array of image URLs
const parsePhotos = (photosHtml: string): string[] => {
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

export function useConstruction(sr: string) {
  const [data, setData] = useState<ConstructionDetail | null>(null);
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
        let allData: ConstructionDetail[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await api.getConstructionBySR(cleanSR, offset, maxSize);

          if (response.list && response.list.length > 0) {
            const parsedData = response.list.map((rawData: any) => ({
              ...rawData,
              photos: rawData.photos ? parsePhotos(rawData.photos) : [],
              materials: rawData.materials || [],
              notes: rawData.notes || null,
            }));
            allData = [...allData, ...parsedData];
            offset += maxSize;
          } else {
            hasMore = false;
          }
        }

        setData(allData.length > 0 ? allData[0] : null); // Assuming you need the first construction record
        setError(null);
      } catch (err) {
        console.error("Error fetching construction data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sr]);

  return { data, loading, error };
}

export default useConstruction;
