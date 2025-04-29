'use client';

import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface GlobalNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userName: string;
  fileName: string;
}

const GlobalNotification: React.FC<GlobalNotificationProps> = ({
  isOpen,
  onClose,
  onRefresh,
  userName,
  fileName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">New Import</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-2">
            <span className="font-medium">{userName}</span> has imported new data
          </p>
          <p className="text-sm text-gray-500 mb-4">
            File: <span className="font-medium">{fileName}</span>
          </p>
          <p className="text-sm text-gray-600">
            Would you like to refresh to see the latest changes?
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalNotification;