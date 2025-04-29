"use client";
import jsVectorMap from "jsvectormap";
import "jsvectormap/dist/jsvectormap.css";
import React, { useEffect } from "react";
import "../../js/greece-map";

const GreeceMap = ({ data }) => {
  useEffect(() => {
    // Process data for markers
    const markers = [];
    if (data) {
      Object.entries(data).forEach(([apiName, apiData]) => {
        if (apiData.list && Array.isArray(apiData.list)) {
          apiData.list.forEach((item) => {
            const lat = parseFloat(item.latitude);
            const lng = parseFloat(item.longitude);
            
            if (!isNaN(lat) && !isNaN(lng) && 
                lat >= 34 && lat <= 42 && 
                lng >= 19 && lng <= 30) {
              markers.push({
                name: item.municipality || 'Unknown',
                coords: [lat, lng],
                style: { fill: item.status === 'ΟΛΟΚΛΗΡΩΣΗ' ? '#10B981' : '#3056D3' }
              });
            }
          });
        }
      });
    }

    const map = new jsVectorMap({
      selector: "#greeceMap",
      map: "greece",
      zoomButtons: true,
      
      markers: markers,
      markerStyle: {
        initial: {
          fill: '#3056D3',
          stroke: '#fff',
          "stroke-width": 1,
          r: 5
        },
        hover: {
          fill: '#10B981',
          cursor: 'pointer'
        }
      },
      
      regionStyle: {
        initial: {
          fill: "#C8D0D8",
        },
        hover: {
          fillOpacity: 1,
          fill: "#3056D3",
        },
      },

      onMarkerTipShow(event, tip, code) {
        const marker = markers[code];
        tip.html(`
          <div class="bg-white p-2 rounded-lg shadow-lg dark:bg-boxdark">
            <div class="font-bold dark:text-white">${marker.name}</div>
            <div class="text-sm dark:text-bodydark">Status: ${marker.style.fill === '#10B981' ? 'ΟΛΟΚΛΗΡΩΣΗ' : 'ΝΕΟ'}</div>
          </div>
        `);
      }
    });

    return () => {
      const mapElement = document.getElementById("greeceMap");
      if (mapElement) {
        mapElement.innerHTML = "";
      }
    };
  }, [data]);

  return (
    <div className="mt-4">
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <h4 className="mb-4 text-xl font-semibold text-black dark:text-white">
          Γεωγραφική Κατανομή
        </h4>
        <div className="h-[300px] w-full"> {/* Adjusted height here */}
          <div id="greeceMap" className="h-full w-full"></div>
        </div>
      </div>

      <style jsx global>{`
        .jvm-tooltip {
          background: white;
          border-radius: 0.375rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 0.5rem;
        }

        .dark .jvm-tooltip {
          background: #1e2139;
          color: #fff;
        }

        .jvm-zoom-btn {
          background-color: white;
          border: 1px solid #e5e7eb;
          color: #333;
          padding: 3px;
          border-radius: 3px;
          line-height: 1;
          margin: 2px;
        }

        .dark .jvm-zoom-btn {
          background-color: #1e2139;
          border-color: #2e3446;
          color: #fff;
        }

        .jvm-zoom-btn:hover {
          background-color: #3056D3;
          border-color: #3056D3;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default GreeceMap;