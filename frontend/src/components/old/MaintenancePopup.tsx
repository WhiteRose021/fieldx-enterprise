// components/MaintenancePopup.tsx
"use client";
import React from 'react';

const MaintenancePopup = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-boxdark p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            System Maintenance
          </h2>
          <div className="mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              The system is currently undergoing maintenance.
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Please try again later. Only administrators can access the system during maintenance.
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            We apologize for any inconvenience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePopup;