'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ImportRecord {
  id: string;
  entityType: string;
  fileName: string;
  timestamp: string;
  importedBy: string;
  status: string;
  importedRecords: string[];
  parameters: {
    apiName: string;
    fieldMappings: {
      sourceField: string;
      targetField: string;
      isSkipped: boolean;
    }[];
  };
}

const ImportHistory: React.FC = () => {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showGlobalNotification, setShowGlobalNotification] = useState(false);

  useEffect(() => {
    const loadImports = () => {
      const storedImports = JSON.parse(localStorage.getItem('importHistory') || '[]');
      setImports(storedImports);
    };

    loadImports();

    // Listen for storage changes (e.g., from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'importHistory') {
        loadImports();
      }
      if (e.key === 'pendingImportNotification' && e.newValue) {
        setShowGlobalNotification(true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const pendingNotification = localStorage.getItem('pendingImportNotification');
    if (pendingNotification) {
      setShowGlobalNotification(true);
    }

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleImportWithSameParams = (importRecord: ImportRecord) => {
    window.location.href = `/Import?params=${encodeURIComponent(JSON.stringify(importRecord.parameters))}`;
  };

  const handleRefresh = () => {
    localStorage.removeItem('pendingImportNotification');
    window.location.reload();
  };

  const handleMaybeLater = () => {
    localStorage.removeItem('pendingImportNotification');
    setShowGlobalNotification(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Import History</h2>
      </div>

      {imports.length === 0 ? (
        <p className="text-gray-500">No import history available.</p>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imported By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.map((importRecord) => (
                  <tr key={importRecord.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{importRecord.entityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <button 
                        onClick={() => {
                          setSelectedImport(importRecord);
                          setShowDetails(true);
                        }}
                        className="hover:underline"
                      >
                        {importRecord.fileName}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {importRecord.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{importRecord.importedBy}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleImportWithSameParams(importRecord)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Import with same parameters
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDetails && selectedImport && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
          <div 
            className="relative p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white"
            style={{ animation: 'slideIn 0.3s ease-out' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Import Details</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Imported Records</h4>
                <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                  {selectedImport.importedRecords.map((record, index) => (
                    <div key={index} className="text-sm text-gray-600">{record}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium">Import Parameters</h4>
                <div className="mt-2">
                  <div className="text-sm text-gray-600">API: {selectedImport.parameters.apiName}</div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => handleImportWithSameParams(selectedImport)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Import with same parameters
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Notification */}
      {showGlobalNotification && (
        <div
          className="fixed bottom-4 left-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm animate-fadeIn"
        >
          <p className="text-sm">
            A new import has been uploaded by {imports[0]?.importedBy || 'admin'} at {imports[0]?.timestamp || new Date().toLocaleTimeString()}. Refresh to see the data?
          </p>
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={handleRefresh}
              className="px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
            >
              Refresh
            </button>
            <button
              onClick={handleMaybeLater}
              className="px-3 py-1 bg-transparent text-white rounded hover:bg-blue-700"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ImportHistory;