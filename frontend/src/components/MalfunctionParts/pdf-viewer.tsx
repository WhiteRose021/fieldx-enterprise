import React, { useState } from 'react';
import { 
  FileArchiveIcon, 
  Upload, 
  Download, 
  Trash, 
  ExternalLink,
  Loader2
} from 'lucide-react';

export type PdfFile = {
  id: string;
  name: string;
  type: string;
  fieldType: string;
};

interface PdfViewerProps {
  pdfs: PdfFile[];
  loading: boolean;
  isEditMode: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, fieldType: string) => void;
  onDelete: (id: string, fieldType: string) => void;
}

/**
 * A component for displaying and managing PDF attachments
 */
export const PdfViewer: React.FC<PdfViewerProps> = ({
  pdfs,
  loading,
  isEditMode,
  onUpload,
  onDelete
}) => {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");

  const selectPdf = (id: string) => {
    setSelectedPdf(id);
    setPdfPreviewUrl(`/api/attachments/${id}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileArchiveIcon className="h-5 w-5 text-gray-500" />
          Έγγραφα PDF
          <span className="text-sm text-gray-500 font-normal">
            ({pdfs.length})
          </span>
        </h2>
        
        {isEditMode && (
          <div>
            <label 
              htmlFor="pdf-upload" 
              className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded-lg border border-blue-200 flex items-center gap-2 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Προσθήκη PDF</span>
            </label>
            <input 
              id="pdf-upload" 
              type="file" 
              className="hidden"
              onChange={(e) => onUpload(e, "pdfattachment")}
              accept=".pdf,application/pdf"
            />
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-gray-50 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span>Φόρτωση εγγράφων PDF...</span>
        </div>
      ) : pdfs.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="flex flex-col items-center justify-center space-y-4">
            <FileArchiveIcon className="h-12 w-12 text-gray-400" />
            <p className="text-gray-500">
              {isEditMode 
                ? "Δεν υπάρχουν PDF έγγραφα. Κάντε κλικ στο 'Προσθήκη PDF' για να προσθέσετε."
                : "Δεν υπάρχουν διαθέσιμα PDF έγγραφα."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* PDF Files List */}
          <div className="lg:col-span-4 space-y-3">
            {pdfs.map((pdf) => (
              <div 
                key={pdf.id} 
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  selectedPdf === pdf.id 
                    ? "bg-blue-50 border-blue-200" 
                    : "bg-white border-gray-200 hover:bg-gray-50"
                } transition-colors cursor-pointer`}
                onClick={() => selectPdf(pdf.id)}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileArchiveIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {pdf.name || "PDF Έγγραφο"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {pdf.type || "application/pdf"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 ml-2">
                  <a
                    href={`/api/attachments/${pdf.id}?download=true`}
                    download={pdf.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {isEditMode && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(pdf.id, pdf.fieldType);
                        if (selectedPdf === pdf.id) {
                          setSelectedPdf(null);
                          setPdfPreviewUrl("");
                        }
                      }}
                      className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Delete document"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* PDF Viewer */}
          <div className="lg:col-span-8 bg-white p-2 rounded-lg border border-gray-200">
            {selectedPdf && pdfPreviewUrl ? (
              <div className="relative h-[70vh]">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full rounded border border-gray-200"
                  title={pdfs.find(a => a.id === selectedPdf)?.name || "PDF Preview"}
                />
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                    title="Open in new window"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a
                    href={`${pdfPreviewUrl}?download=true`}
                    download
                    className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                    title="Download document"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[70vh] text-gray-500">
                <FileArchiveIcon className="h-12 w-12 mb-2 text-gray-400" />
                <p>Επιλέξτε ένα PDF έγγραφο για προβολή</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfViewer;