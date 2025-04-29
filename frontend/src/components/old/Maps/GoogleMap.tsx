"use client";

import React from 'react';

interface MapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const GoogleMap: React.FC<MapProps> = ({ latitude, longitude, address }) => {
  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=17&output=embed`}
        title={`Map showing location of ${address}`}
        className="border-0"
      ></iframe>
    </div>
  );
};

export default GoogleMap;