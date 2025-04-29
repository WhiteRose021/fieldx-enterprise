// components/map/DashboardMap.tsx
'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { Vehicle } from '@/types/vehicle'; // Adjust import path as needed

// Map Center Control Component
const MapCenterControl: React.FC<{ validVehicles: Vehicle[] }> = ({ validVehicles }) => {
  const map = useMap();
  const center: [number, number] = [37.9838, 23.7275]; // Athens coordinates
  
  const handleCenterMap = useCallback(() => {
    if (validVehicles.length > 0) {
      const bounds = L.latLngBounds(validVehicles.map(v => [v.lat, v.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, 12);
    }
  }, [map, validVehicles, center]);
  
  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: '10px', marginRight: '10px' }}>
      <div className="leaflet-control leaflet-bar">
        <button 
          className="flex items-center justify-center bg-white text-blue-600 hover:bg-blue-50 w-8 h-8 rounded-md shadow-md border border-blue-400 transition-colors duration-200"
          onClick={handleCenterMap}
          title="Επαναφορά χάρτη στο κέντρο"
        >
          <LocateFixed size={16} />
        </button>
      </div>
    </div>
  );
};

// Create vehicle icon
const createVehicleIcon = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">V</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

interface DashboardMapProps {
  vehicles: Vehicle[];
}

// Main component for map rendering
const DashboardMap: React.FC<DashboardMapProps> = ({ vehicles = [] }) => {
  // Generate a unique ID for this instance of the map
  const mapId = useMemo(() => `map-${Math.random().toString(36).substring(2, 15)}`, []);
  const [isMounted, setIsMounted] = useState(false);
  const center: [number, number] = [37.9838, 23.7275]; // Athens coordinates
  const iconInstance = useMemo(() => createVehicleIcon(), []);
  
  // Filter out invalid coordinates
  const validVehicles = useMemo(() => 
    vehicles.filter(v => 
      typeof v?.lat === 'number' && 
      typeof v?.lng === 'number' && 
      !isNaN(v.lat) && 
      !isNaN(v.lng)
    ), 
    [vehicles]
  );

  // Only render on client side
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
    return (
      <div style={{ height: '250px', width: '100%' }} className="bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div id={mapId} style={{ height: '250px', width: '100%' }}>
      <MapContainer 
        key={mapId}
        center={center} 
        zoom={12} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer 
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png" 
          attribution='© <a href="https://stadiamaps.com/">Stadia Maps</a>' 
        />
        <MapCenterControl validVehicles={validVehicles} />
        {validVehicles.map(vehicle => (
          <Marker 
            key={vehicle.id} 
            position={[vehicle.lat, vehicle.lng]} 
            icon={iconInstance} 
          >
            <Tooltip 
              permanent={false} 
              offset={[0, -10]} 
              opacity={1}
            >
              <div className="p-1 text-xs">
                <div className="font-medium">{vehicle.id}</div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DashboardMap;