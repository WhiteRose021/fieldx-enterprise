import React, { useState, useEffect, useCallback } from 'react';
import { FileArchiveIcon, Download, Trash, ExternalLink, X } from 'lucide-react';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin', 'greek'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

interface AttachmentFile {
    id: string;
    name: string;
    type: string;
    url?: string;
  }
  
interface PDFViewerProps {
  attachments: AttachmentFile[];
  onDelete?: (id: string) => Promise<void>;
  isEditMode?: boolean;
  baseUrl: string;
}

/**
 * Specialized component for handling PDF viewing in the malfunction detail page
 */
export const PDFViewer: React.FC<PDFViewerProps> = ({
  attachments,
  onDelete,
  isEditMode = false,
  baseUrl
}) => {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(
    attachments.length > 0 ? attachments[0].id : null
  );
  const [fullscreenView, setFullscreenView] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Set the first PDF as selected when attachments change
  useEffect(() => {
    if (attachments.length > 0 && !selectedPdf) {
      setSelectedPdf(attachments[0].id);
    } else if (attachments.length === 0) {
      setSelectedPdf(null);
    }
  }, [attachments, selectedPdf]);

  // Handle PDF selection
  const handleSelectPdf = (id: string) => {
    setIsLoading(true);
    setSelectedPdf(id);
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // Toggle fullscreen view
  const toggleFullscreen = () => {
    setFullscreenView(!fullscreenView);
  };

  // Spinner component for loading state
  const Spinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75 rounded-lg">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
    </div>
  );

  return (
    <div className={inter.className}>
      {fullscreenView && selectedPdf ? (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg overflow-hidden shadow-xl max-w-5xl w-full h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {attachments.find(a => a.id === selectedPdf)?.name || "PDF Viewer"}
              </h3>
              <button
                onClick={() => setFullscreenView(false)}
                className="rounded-full p-1 hover:bg-gray-200 focus:outline-none transition-colors"
              >
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
              {isLoading && <Spinner />}
              <iframe
                src={`${baseUrl}/Attachment/${selectedPdf}`}
                className="w-full h-full"
                title={attachments.find(a => a.id === selectedPdf)?.name || "PDF Preview"}
                onLoad={handleIframeLoad}
              />
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end">
              <div className="flex gap-2">
                <a
                  href={`${baseUrl}/Attachment/${selectedPdf}?download=true`}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  download
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  Λήψη
                </a>
                <a
                  href={`${baseUrl}/Attachment/${selectedPdf}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  <ExternalLink className="h-4 w-4 mr-1.5" />
                  Άνοιγμα σε νέο παράθυρο
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* PDF Files List */}
          <div className="lg:col-span-4 space-y-3">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  selectedPdf === attachment.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-aspro border-gray-200 hover:bg-gray-50'
                } transition-colors cursor-pointer`}
                onClick={() => handleSelectPdf(attachment.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileArchiveIcon size={24} className="text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {attachment.name || "PDF Έγγραφο"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment.type || "application/pdf"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <a 
                    href={`${baseUrl}/Attachment/${attachment.id}?download=true`}
                    className="p-1.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                    title="Λήψη εγγράφου"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={16} />
                  </a>
                  {isEditMode && onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(attachment.id);
                      }}
                      className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Διαγραφή εγγράφου"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* PDF Viewer */}
          <div className="lg:col-span-8 bg-aspro p-2 rounded-lg border border-gray-200">
            {selectedPdf ? (
              <div className="relative h-[70vh]">
                {isLoading && <Spinner />}
                <iframe
                  src={`${baseUrl}/Attachment/${selectedPdf}`}
                  className="w-full h-full rounded border border-gray-200"
                  title={attachments.find(a => a.id === selectedPdf)?.name || "PDF Preview"}
                  onLoad={handleIframeLoad}
                />
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                    title="Πλήρης οθόνη"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  </button>
                  <a 
                    href={`${baseUrl}/Attachment/${selectedPdf}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                    title="Άνοιγμα σε νέο παράθυρο"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
                <FileArchiveIcon size={48} className="mb-2 text-gray-400" />
                <p>Επιλέξτε ένα PDF έγγραφο για προβολή</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
