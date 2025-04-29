"use client";

import React from 'react';
import { MapPin } from "lucide-react";

interface GoogleMapProps {
  latitude?: string | number;
  longitude?: string | number;
  address?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ latitude, longitude, address }) => {
  // Make sure we have valid coordinates
  const validLat = latitude && !isNaN(parseFloat(String(latitude))) ? parseFloat(String(latitude)) : null;
  const validLng = longitude && !isNaN(parseFloat(String(longitude))) ? parseFloat(String(longitude)) : null;
  
  // Create a URL-encoded address for the map
  const encodedAddress = address ? encodeURIComponent(address) : '';
  
  // Create a better embed URL that works more reliably
  const mapUrl = validLat && validLng 
    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${validLat},${validLng}&zoom=18`
    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodedAddress}&zoom=15`;

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      {(validLat && validLng) || address ? (
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`Map showing location of ${address || 'selected coordinates'}`}
        ></iframe>
      ) : (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="font-medium text-gray-500">Δεν έχουν καταχωρηθεί συντεταγμένες</p>
            <p className="text-sm text-gray-500 mt-1">Δεν έχει καταχωρηθεί διεύθυνση</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMap;