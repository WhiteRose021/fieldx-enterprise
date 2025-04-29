"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Trash, 
  Image, 
  File, 
  Upload,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  fieldType: string;
}

interface AttachmentHandlerProps {
  attachments: AttachmentFile[];
  onDelete: (id: string, fieldType: string) => Promise<void>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditMode: boolean;
  title?: string;
}

const AttachmentHandler: React.FC<AttachmentHandlerProps> = ({
  attachments,
  onDelete,
  onFileUpload,
  isEditMode,
  title
}) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);

  // Handle attachment deletion with loading state
  const handleDelete = async (id: string, fieldType: string) => {
    try {
      setDeleting(id);
      await onDelete(id, fieldType);
    } finally {
      setDeleting(null);
    }
  };

  // Determine if file is an image based on type or name
  const isImage = (file: AttachmentFile) => {
    return file.type?.startsWith('image/') || 
      (file.name && /\.(jpg|jpeg|png|gif|svg|bmp|webp)$/i.test(file.name));
  };

  // Group attachments by type
  const imageAttachments = attachments.filter(att => isImage(att));
  const documentAttachments = attachments.filter(att => !isImage(att));

  // Render image preview modal
  const renderImagePreview = () => {
    if (!previewImage) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">{previewImage.name}</h3>
            <button 
              onClick={() => setPreviewImage(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="overflow-auto p-4 flex items-center justify-center flex-1">
            <img 
              src={previewImage.url} 
              alt={previewImage.name} 
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
          <div className="p-4 border-t flex justify-end">
            <a 
              href={previewImage.url} 
              download={previewImage.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-2"
            >
              Download
            </a>
            <button 
              onClick={() => setPreviewImage(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      
      {/* Image Attachments */}
      {imageAttachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Φωτογραφίες</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageAttachments.map(attachment => (
              <div key={attachment.id} className="group relative">
                <div 
                  className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer"
                  onClick={() => setPreviewImage({ 
                    url: `/api/attachments/${attachment.id}`, 
                    name: attachment.name 
                  })}
                >
                  <img 
                    src={`/api/attachments/${attachment.id}`} 
                    alt={attachment.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                      (e.target as HTMLImageElement).className = "w-12 h-12 text-gray-400";
                    }}
                  />
                  
                  {/* Overlay with buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/api/attachments/${attachment.id}`, '_blank');
                      }}
                      className="p-2 bg-white rounded-full shadow-md mx-1"
                      title="View full size"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                    </button>
                    <a
                      href={`/api/attachments/${attachment.id}?download=true`}
                      download={attachment.name}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 bg-white rounded-full shadow-md mx-1"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-600" />
                    </a>
                    {isEditMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(attachment.id, attachment.fieldType);
                        }}
                        disabled={deleting === attachment.id}
                        className="p-2 bg-white rounded-full shadow-md mx-1"
                        title="Delete"
                      >
                        {deleting === attachment.id ? (
                          <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                        ) : (
                          <Trash className="h-4 w-4 text-red-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 text-sm truncate" title={attachment.name}>
                  {attachment.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Document Attachments */}
      {documentAttachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Αρχεία</h4>
          <div className="space-y-2">
            {documentAttachments.map(attachment => (
              <div key={attachment.id} className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  {attachment.type === 'application/pdf' || attachment.name.match(/\.pdf$/i) ? (
                    <FileText size={24} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <File size={24} className="text-blue-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{attachment.name}</p>
                    <p className="text-xs text-gray-500">{attachment.type || "Unknown type"}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {attachment.type === 'application/pdf' || attachment.name.match(/\.pdf$/i) ? (
                    <a
                      href={`/api/attachments/${attachment.id}`}
                      target="_blank"
                      className="p-1.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                      title="View"
                    >
                      <ExternalLink size={16} />
                    </a>
                  ) : null}
                  <a
                    href={`/api/attachments/${attachment.id}?download=true`}
                    download={attachment.name}
                    className="p-1.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                  {isEditMode && (
                    <button
                      onClick={() => handleDelete(attachment.id, attachment.fieldType)}
                      disabled={deleting === attachment.id}
                      className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                      title="Delete"
                    >
                      {deleting === attachment.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* File Upload Section (only in edit mode) */}
      {isEditMode && (
        <div className="mt-4">
          <label 
            htmlFor="file-upload"
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 cursor-pointer w-fit"
          >
            <Upload size={18} />
            <span>Προσθήκη Αρχείων</span>
          </label>
          <input 
            id="file-upload" 
            type="file" 
            multiple 
            className="hidden" 
            onChange={onFileUpload}
          />
        </div>
      )}
      
      {/* Empty State */}
      {attachments.length === 0 && (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Image className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Χωρίς αρχεία</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isEditMode 
              ? "Δεν υπάρχουν αρχεία ακόμα. Κάντε κλικ στο κουμπί προσθήκης για να ανεβάσετε." 
              : "Δεν υπάρχουν διαθέσιμα αρχεία."}
          </p>
          
          {isEditMode && (
            <div className="mt-6">
              <label 
                htmlFor="file-upload-empty"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200 cursor-pointer w-fit mx-auto hover:bg-blue-100 transition-colors"
              >
                <Upload size={18} />
                <span>Προσθήκη Αρχείων</span>
              </label>
              <input 
                id="file-upload-empty" 
                type="file" 
                multiple 
                className="hidden" 
                onChange={onFileUpload}
              />
            </div>
          )}
        </div>
      )}
      
      {/* Image Preview Modal */}
      {renderImagePreview()}
    </div>
  );
};

export default AttachmentHandler;