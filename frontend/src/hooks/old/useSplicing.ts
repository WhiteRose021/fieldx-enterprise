import { useState, useEffect } from 'react';
import api from '@/services/api';

interface SplicingDetail {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  sr: string;
  customerMobile: string;
  customerAddress: string;
  bep: string;
  mapsurl: string;
  photos: string[]; // Array of image URLs
  customerFloor: string;
  bmo: string;
  tobbfloors?: string; // HTML content for floors table
  tobbopticalpaths?: string; // HTML content for optical paths table
  [key: string]: any; // Allow additional fields
}

// Helper function to parse the photos HTML string into an array of image URLs
const parsePhotos = (photosHtml: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(photosHtml, 'text/html');
  const imageLinks: string[] = [];
  doc.querySelectorAll('a').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (href) {
      imageLinks.push(href);
    }
  });
  return imageLinks;
};

export function useSplicing(sr: string) {
  const [data, setData] = useState<SplicingDetail[]>([]);
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
        const cleanSR = sr.trim(); // Clean any whitespace
        const maxSize = 50;
        let offset = 0;
        let allData: SplicingDetail[] = [];
        let hasMore = true;

        while (hasMore) {
          const response = await api.getSplicingBySr(cleanSR, offset, maxSize);

          if (response.list && response.list.length > 0) {
            const parsedData = response.list.map((rawData: any) => ({
              ...rawData,
              photos: rawData.photos ? parsePhotos(rawData.photos) : [],
              tobbfloors: rawData.tobbfloors || null,
              tobbopticalpaths: rawData.tobbopticalpaths || null,
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
        console.error('Error fetching splicing data:', err);
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

export default useSplicing;
