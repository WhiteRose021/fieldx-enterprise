// ImportModal.tsx
import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertTriangle, Check, Info } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Reset states
    setError(null);
    setSuccess(false);
    
    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(file.type)) {
      setError('Παρακαλώ επιλέξτε ένα έγκυρο αρχείο CSV ή Excel.');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Το μέγεθος του αρχείου υπερβαίνει το όριο των 5MB.');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await onImport(selectedFile);
      
      setSuccess(true);
      setSelectedFile(null);
      
      // Close modal after successful import with delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Προέκυψε άγνωστο σφάλμα κατά την εισαγωγή.');
      }
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
              <Upload className="w-5 h-5 text-blue-600" />
              Εισαγωγή Προϊόντων
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
            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 mb-4 rounded flex items-start">
                <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {/* Success message */}
            {success && (
              <div className="p-3 bg-green-50 border-l-4 border-green-500 text-green-700 mb-4 rounded flex items-start">
                <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">Τα προϊόντα εισήχθησαν με επιτυχία!</p>
              </div>
            )}
            
            {/* File upload area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />
              
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              
              <p className="mt-2 text-sm font-medium text-gray-900">
                {selectedFile ? selectedFile.name : 'Σύρετε & Αφήστε το αρχείο σας εδώ'}
              </p>
              
              <p className="mt-1 text-xs text-gray-500">
                {selectedFile 
                  ? `${(selectedFile.size / 1024).toFixed(2)} KB` 
                  : 'Μόνο αρχεία CSV ή Excel (μέγιστο 5MB)'}
              </p>
              
              {!selectedFile && (
                <button
                  type="button"
                  className="mt-4 inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Επιλογή Αρχείου
                </button>
              )}
            </div>
            
            <div className="flex items-start mt-4">
              <Info className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">Απαιτήσεις Μορφής CSV:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Οι επικεφαλίδες πρέπει να περιλαμβάνουν: SKU, Όνομα, Κατηγορία, Περιγραφή, Τοποθεσία, Ποσότητα</li>
                  <li>Το SKU και το Όνομα είναι υποχρεωτικά για κάθε προϊόν</li>
                  <li>Χρησιμοποιήστε ερωτηματικά (;) ως διαχωριστικά</li>
                </ul>
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
              onClick={handleImport}
              disabled={!selectedFile || isLoading}
              className={`ml-3 inline-flex items-center text-white rounded-lg text-sm px-5 py-2.5 text-center ${
                selectedFile && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300'
                  : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Εισαγωγή σε εξέλιξη...
                </>
              ) : (
                'Εισαγωγή Προϊόντων'
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

export default ImportModal;