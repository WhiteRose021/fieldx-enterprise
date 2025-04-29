// ExportModal.tsx
import React, { useState } from 'react';
import { Download, X, FileText, FileCog } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => Promise<void>;
  productCount: number;
}

const ExportModal: React.FC<ExportModalProps> = ({ 
  isOpen, 
  onClose, 
  onExport,
  productCount
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeStockHistory, setIncludeStockHistory] = useState(false);
  
  if (!isOpen) return null;
  
  const handleExport = async () => {
    try {
      setIsLoading(true);
      await onExport();
      // Success handling is done by the parent component
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="relative w-full max-w-md animate-modal-in">
        <div className="relative bg-aspro rounded-lg shadow-xl">
          {/* Modal Header */}
          <div className="flex items-start justify-between p-4 border-b rounded-t">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Εξαγωγή Προϊόντων
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-6 space-y-6">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900">Εξαγωγή {productCount} Προϊόντων</h4>
              <p className="text-sm text-gray-500 mt-1">Επιλέξτε μορφή εξαγωγής και επιλογές</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Μορφή Εξαγωγής</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`py-3 px-4 border rounded-md flex flex-col items-center justify-center ${
                    exportFormat === 'csv' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <FileText className={`w-6 h-6 ${exportFormat === 'csv' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="mt-1 text-sm">CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('excel')}
                  className={`py-3 px-4 border rounded-md flex flex-col items-center justify-center ${
                    exportFormat === 'excel' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <FileCog className={`w-6 h-6 ${exportFormat === 'excel' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="mt-1 text-sm">Excel</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Επιλογές Εξαγωγής</label>
              
              <div className="flex items-center">
                <input
                  id="include-description"
                  type="checkbox"
                  checked={includeDescription}
                  onChange={() => setIncludeDescription(!includeDescription)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="include-description" className="ml-2 text-sm text-gray-700">
                  Συμπερίληψη περιγραφών προϊόντων
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="include-deleted"
                  type="checkbox"
                  checked={includeDeleted}
                  onChange={() => setIncludeDeleted(!includeDeleted)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="include-deleted" className="ml-2 text-sm text-gray-700">
                  Συμπερίληψη διαγραμμένων προϊόντων
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="include-stock-history"
                  type="checkbox"
                  checked={includeStockHistory}
                  onChange={() => setIncludeStockHistory(!includeStockHistory)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="include-stock-history" className="ml-2 text-sm text-gray-700">
                  Συμπερίληψη ιστορικού αποθέματος
                </label>
              </div>
            </div>
          </div>
          
          {/* Modal Footer */}
          <div className="flex items-center p-4 border-t border-gray-200 rounded-b">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 bg-aspro hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10"
            >
              Ακύρωση
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className="ml-3 inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Εξαγωγή σε εξέλιξη...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Εξαγωγή ως {exportFormat.toUpperCase()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-modal-in {
          animation: modal-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ExportModal;