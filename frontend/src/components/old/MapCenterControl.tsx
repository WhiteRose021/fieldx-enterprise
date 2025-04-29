// MapCenterControl.tsx
"use client";

import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { Locate } from 'lucide-react';

interface MapMarker {
  latitude: number;
  longitude: number;
  label: string;
  job?: any;
}

interface MapCenterControlProps {
  markers: MapMarker[];
}

const MapCenterControl: React.FC<MapCenterControlProps> = ({ markers }) => {
  const map = useMap();

  const handleCenterMap = () => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(marker => [marker.latitude, marker.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView([37.9838, 23.7275], 11);
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '70px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button
          className="flex items-center justify-center bg-aspro text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-md shadow-md border border-blue-400"
          onClick={handleCenterMap}
          title="Επαναφορά χάρτη στο κέντρο"
        >
          <Locate size={16} />
        </button>
      </div>
    </div>
  );
};

export default MapCenterControl;