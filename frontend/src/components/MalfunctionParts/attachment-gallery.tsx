import React, { useState } from 'react';
import { 
  Image, 
  FileText, 
  Upload, 
  Trash, 
  Download, 
  Loader2,
  X
} from 'lucide-react';

export type AttachmentFile = {
  id: string;
  name: string;
  type: string;
  url?: string;
  fieldType: string;
};

interface AttachmentGalleryProps {
  attachments: AttachmentFile[];
  type: 'photos' | 'soilphotos';
  title: string;
  loading: boolean;
  isEditMode: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, fieldType: string) => void;
  onDelete: (id: string, fieldType: string) => void;
}

/**
 * A component for displaying and managing malfunction photos/attachments
 */
export const AttachmentGallery: React.FC<AttachmentGalleryProps> = ({
  attachments,
  type,
  title,
  loading,
  isEditMode,
  onUpload,
  onDelete
}) => {
  const [imageViewer, setImageViewer] = useState<{
    open: boolean;
    url: string;
    name: string;
  }>({
    open: false,
    url: '',
    name: ''
  });

  // Filter attachments by the specified type
  const filteredAttachments = attachments.filter(att => 
    att.fieldType === type && 
    (att.type?.startsWith('image/') || att.name.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i))
  );

  const openImageViewer = (id: string, name: string) => {
    setImageViewer({
      open: true,
      url: `/api/attachments/${id}`,
      name
    });
  };

  const closeImageViewer = () => {
    setImageViewer({ open: false, url: '', name: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <h3 className="text-md font-medium text-gray-700 flex items-center gap-2">
          <Image className="h-5 w-5 text-gray-500" />
          {title} 
          <span className="text-sm text-gray-500 font-normal">
            ({filteredAttachments.length})
          </span>
        </h3>

        {isEditMode && (
          <div>
            <label 
              htmlFor={`${type}-upload`}
              className={`cursor-pointer px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors
                ${type === 'photos' 
                  ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200' 
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border border-green-200'
                }`}
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">{title.includes('Χώματος') ? 'Προσθήκη Φωτογραφιών Χώματος' : 'Προσθήκη Φωτογραφιών'}</span>
            </label>
            <input
              id={`${type}-upload`}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onUpload(e, type)}
              accept="image/*"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span>Φόρτωση φωτογραφιών...</span>
        </div>
      ) : filteredAttachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg">
          <Image className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-gray-500">
            {isEditMode 
              ? `Δεν υπάρχουν ${title.toLowerCase()}. Κάντε κλικ στο κουμπί προσθήκης για να ανεβάσετε.`
              : `Δεν υπάρχουν διαθέσιμες ${title.toLowerCase()}.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAttachments.map(attachment => (
            <div key={attachment.id} className="relative group">
              <div 
                className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center cursor-pointer"
                onClick={() => openImageViewer(attachment.id, attachment.name)}
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
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm truncate max-w-[150px]">{attachment.name}</span>
                <div className="flex">
                  <a
                    href={`/api/attachments/${attachment.id}?download=true`}
                    download={attachment.name}
                    className="p-1 text-gray-600 hover:text-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  {isEditMode && (
                    <button
                      onClick={() => onDelete(attachment.id, attachment.fieldType)}
                      className="p-1 text-red-600 hover:text-red-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Image Viewer Modal */}
      {imageViewer.open && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh]">
            <img 
              src={imageViewer.url}
              alt={imageViewer.name}
              className="mx-auto max-h-[80vh] object-contain"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <a
                href={`${imageViewer.url}?download=true`}
                download={imageViewer.name}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
                title="Download image"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                onClick={closeImageViewer}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
                title="Close viewer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg text-sm">
                {imageViewer.name}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentGallery;