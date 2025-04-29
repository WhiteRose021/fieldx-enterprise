import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Download, Trash, X } from 'lucide-react';
import api from '@/services/api';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin', 'greek'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const BASE_URL = 'http://192.168.4.150:8080/api/v1';

interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  url?: string;
}

interface AttachmentHandlersProps {
  attachments: AttachmentFile[];
  onDelete: (id: string) => Promise<void>;
  onFileUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isEditMode?: boolean;
}

const AttachmentHandlers: React.FC<AttachmentHandlersProps> = ({
    attachments,
    onDelete,
    onFileUpload,
    isEditMode = false
  }) => {
    const [imageAttachments, setImageAttachments] = useState<AttachmentFile[]>([]);
    const [documentAttachments, setDocumentAttachments] = useState<AttachmentFile[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
    const [cachedImages, setCachedImages] = useState<Record<string, string>>({});
    const [cachedThumbnails, setCachedThumbnails] = useState<Record<string, string>>({});
    const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({});
    const [isInitializing, setIsInitializing] = useState(true);
  
    // Separate the attachment sorting from image loading
    useEffect(() => {
      const images: AttachmentFile[] = [];
      const documents: AttachmentFile[] = [];
      const newLoadingImages: Record<string, boolean> = {};
  
      // First, sort attachments and set initial loading states
      attachments.forEach(attachment => {
        const isImage = attachment.type?.startsWith('image/') || 
                       attachment.name.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i);
        
        if (isImage) {
          images.push(attachment);
          newLoadingImages[attachment.id] = true;
        } else {
          documents.push(attachment);
        }
      });
  
      // Update state immediately to show container and spinners
      setImageAttachments(images);
      setDocumentAttachments(documents);
      setLoadingImages(newLoadingImages);
      setIsInitializing(false);
    }, [attachments]);
  
    // Handle image loading separately
    useEffect(() => {
      if (!isInitializing && imageAttachments.length > 0) {
        const loadImages = async () => {
          const newCachedImages: Record<string, string> = { ...cachedImages };
          const newCachedThumbnails: Record<string, string> = { ...cachedThumbnails };
  
          // Load images one by one
          for (const attachment of imageAttachments) {
            if (!newCachedImages[attachment.id] || !newCachedThumbnails[attachment.id]) {
              try {
                const blob = await api.fetchAttachmentImage(attachment.id);
                const imageUrl = URL.createObjectURL(blob);
                
                // Update cache and loading state for each image as it loads
                setCachedImages(prev => ({ ...prev, [attachment.id]: imageUrl }));
                setCachedThumbnails(prev => ({ ...prev, [attachment.id]: imageUrl }));
                setLoadingImages(prev => ({ ...prev, [attachment.id]: false }));
              } catch (error) {
                console.error(`Failed to load image ${attachment.id}:`, error);
                setLoadingImages(prev => ({ ...prev, [attachment.id]: false }));
              }
            } else {
              setLoadingImages(prev => ({ ...prev, [attachment.id]: false }));
            }
          }
        };
  
        loadImages();
      }
  
      // Cleanup function
      return () => {
        Object.values(cachedImages).forEach(url => {
          URL.revokeObjectURL(url);
        });
        Object.values(cachedThumbnails).forEach(url => {
          URL.revokeObjectURL(url);
        });
      };
    }, [isInitializing, imageAttachments]);
  
    // Spinner component
    const Spinner = () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-75">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );

  
    const handleImageClick = async (id: string, index: number) => {
      setCurrentImageIndex(index);
      if (cachedImages[id]) {
        setSelectedImage(cachedImages[id]);
      } else {
        try {
          const blob = await api.fetchAttachmentImage(id);
          const imageUrl = URL.createObjectURL(blob);
          setCachedImages(prev => ({ ...prev, [id]: imageUrl }));
          setSelectedImage(imageUrl);
        } catch (error) {
          console.error(`Failed to load image ${id}:`, error);
        }
      }
    };

  const handleNavigateImage = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? (currentImageIndex + 1) % imageAttachments.length
      : (currentImageIndex - 1 + imageAttachments.length) % imageAttachments.length;
    
    const nextImage = imageAttachments[newIndex];
    await handleImageClick(nextImage.id, newIndex);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (selectedImage) {
      if (e.key === 'ArrowRight') {
        handleNavigateImage('next');
      } else if (e.key === 'ArrowLeft') {
        handleNavigateImage('prev');
      } else if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [selectedImage, currentImageIndex]);

  // Improved download function to ensure proper download with correct filename
  const handleDownload = async (id: string, filename: string) => {
    try {
      // Create a loading state if needed
      console.log(`Downloading attachment ${id}: ${filename}`);
      
      const response = await fetch(`${BASE_URL}/Attachment/file/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${localStorage.getItem('auth_token') || ''}`,
          'Accept': '*/*',
        },
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create link element
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Add to DOM, trigger download, and clean up
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
      console.log(`Download complete for ${filename}`);
      return true;
    } catch (error) {
      console.error('Error downloading file:', error);
      return false;
    }
  };

  return (
    <div className={`${inter.className} space-y-6`}>
      {/* Image Attachments Section */}
      {(imageAttachments.length > 0 || isInitializing) && (
        <div className="bg-aspro rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Εικόνες
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageAttachments.map((attachment, index) => (
              <div key={attachment.id} className="relative group aspect-video bg-gray-50 rounded-lg">
                {loadingImages[attachment.id] && <Spinner />}
                {cachedThumbnails[attachment.id] && (
                  <img
                    src={cachedThumbnails[attachment.id]}
                    alt={attachment.name}
                    className={`w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
                    onClick={() => handleImageClick(attachment.id, index)}
                  />
                )}
                {isEditMode && !loadingImages[attachment.id] && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Attachments Section */}
      {documentAttachments.length > 0 && (
        <div className="bg-aspro rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Έγγραφα
          </h3>
          <div className="space-y-2">
            {documentAttachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm text-gray-700 truncate flex-1">
                  {attachment.name}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDownload(attachment.id, attachment.name);
                    }}
                    className="text-blue-600 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => onDelete(attachment.id)}
                      className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Input - Only shown in edit mode */}
      {isEditMode && onFileUpload && (
        <div className="mt-4">
          <input
            type="file"
            multiple
            onChange={onFileUpload}
            className={`${inter.className} w-full`}
          />
        </div>
      )}

        {/* Image Preview Modal */}
        {selectedImage && (
        <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999]"
            onClick={(e) => {
              // Only close if clicking the outer black background
              if (e.target === e.currentTarget) {
                setSelectedImage(null);
              }
            }}
        >
            {/* Content wrapper */}
            <div className="relative w-full max-w-6xl h-full flex items-center justify-center p-4">
              {/* Counter dialog */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg py-2 px-4">
                <p className={`${inter.className} text-blue-600 font-medium`}>
                  Εικόνα {currentImageIndex + 1} από {imageAttachments.length}
                </p>
              </div>

              {/* Controls wrapper */}
              <div className="absolute top-6 right-6 flex gap-2 z-20">
                {/* Download button */}
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentImage = imageAttachments[currentImageIndex];
                    handleDownload(currentImage.id, currentImage.name);
                  }}
                  aria-label="Download image"
                >
                  <Download className="w-5 h-5 text-blue-600" />
                </button>

                {/* Close button with improved close handling */}
                <button 
                  type="button"
                  className="bg-white hover:bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                  aria-label="Close preview"
                >
                  <X className="w-5 h-5 text-blue-600" />
                </button>
              </div>

              {/* Navigation buttons */}
              {imageAttachments.length > 1 && (
                <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-4 z-10">
                  <button 
                    type="button"
                    className="bg-white hover:bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavigateImage('prev');
                    }}
                    aria-label="Previous image"
                  >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    className="bg-white hover:bg-gray-50 w-10 h-10 rounded-full flex items-center justify-center transition-all transform hover:scale-110 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleNavigateImage('next');
                    }}
                    aria-label="Next image"
                  >
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Main image */}
              <img
                src={selectedImage}
                alt="Preview"
                className="max-h-[85vh] max-w-[85vw] object-contain select-none"
              />
            </div>
        </div>
        )}
    </div>
  );
};

export default AttachmentHandlers;