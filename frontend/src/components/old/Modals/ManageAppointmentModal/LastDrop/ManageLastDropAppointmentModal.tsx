'use client';

import React, { useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { 
  Building2,
  Calendar,
  X,
  FileText,
  Construction,
  AlertCircle,
  Plus,
  Trash,
  Send,
  Package,
  Wifi
} from 'lucide-react';

import { 
  STATUS_OPTIONS, 
  YES_NO_OPTIONS 
} from '@/constants/index';

import { lastDropAppointmentService } from '@/services/lastDropAppointmentService';
import { LastDropAppointment } from '@/types/appointment';
import AttachmentHandlers from '../AttachmentHandler';
import ConfirmDialog from '../ConfirmDialog';

const inter = Inter({ 
  subsets: ['latin', 'greek'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Options for installation fields
const ONT_OPTIONS = [
  { value: 'APPLINK', label: 'APPLINK' },
  { value: 'HUA', label: 'HUA' },
  { value: 'NOKIA', label: 'NOKIA' },
  { value: 'ZTE', label: 'ZTE' }
];

const EIDOSINAS_OPTIONS = [
  { value: '10m HUA', label: '10m HUA' },
  { value: '15m HUA', label: '15m HUA' },
  { value: '20m HUA', label: '20m HUA' },
  { value: '25m HUA', label: '25m HUA' },
  { value: '30m HUA', label: '30m HUA' }
];

const TIPOSERGASIAS_OPTIONS = [
  { value: 'ΚΑΤΑΣΚΕΥΗ FTTH', label: 'ΚΑΤΑΣΚΕΥΗ FTTH' },
  { value: 'ΕΠΙΣΚΕΥΗ FTTH', label: 'ΕΠΙΣΚΕΥΗ FTTH' },
  { value: 'ΕΝΕΡΓΟΠΟΙΗΣΗ FTTH', label: 'ΕΝΕΡΓΟΠΟΙΗΣΗ FTTH' }
];

const AITIAMHOLOKL_OPTIONS = [
  { value: 'ΟΛΟΚΛΗΡΩΣΗ', label: 'ΟΛΟΚΛΗΡΩΣΗ' },
  { value: 'ΑΘΕΤΗΣΗ ΡΑΝΤΕΒΟΥ', label: 'ΑΘΕΤΗΣΗ ΡΑΝΤΕΒΟΥ' },
  { value: 'ΑΔΥΝΑΜΙΑ ΕΠΙΚΟΙΝΩΝΙΑΣ', label: 'ΑΔΥΝΑΜΙΑ ΕΠΙΚΟΙΝΩΝΙΑΣ' },
  { value: 'ΑΔΥΝΑΜΙΑ ΠΡΟΣΒΑΣΗΣ', label: 'ΑΔΥΝΑΜΙΑ ΠΡΟΣΒΑΣΗΣ' },
  { value: 'ΛΑΝΘΑΣΜΕΝΗ ΔΙΕΥΘΥΝΣΗ', label: 'ΛΑΝΘΑΣΜΕΝΗ ΔΙΕΥΘΥΝΣΗ' },
  { value: 'ΑΚΥΡΩΣΗ ΑΠΟ ΠΕΛΑΤΗ', label: 'ΑΚΥΡΩΣΗ ΑΠΟ ΠΕΛΑΤΗ' }
];

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: LastDropAppointment;
  onSave: (data: LastDropAppointment) => Promise<void>;
}

const ManageLastDropAppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave
}) => {
  // Initialize form data with proper typing
  const initialFormData: LastDropAppointment = {
    id: appointment?.id || '', // Ensure id is always a string
    status: appointment?.status || 'ΑΠΟΣΤΟΛΗ',
    dateStart: appointment?.dateStart || new Date().toISOString(),
    dateEnd: appointment?.dateEnd || new Date().toISOString(),
    description: appointment?.description || '',
    comments: appointment?.comments || '',
    isAllDay: appointment?.isAllDay || false,
    duration: appointment?.duration || 7200,
    sr: appointment?.sr || '',
    name: appointment?.name || '',
    tiposergasias: appointment?.tiposergasias || 'ΚΑΤΑΣΚΕΥΗ FTTH',
    eidosinas: appointment?.eidosinas || '10m HUA',
    ont: appointment?.ont || 'APPLINK',
    energopoihsh: appointment?.energopoihsh || 'ΟΧΙ',
    emploutismos: appointment?.emploutismos || 'ΟΧΙ',
    exodeusi: appointment?.exodeusi || 'ΟΧΙ',
    ylika: appointment?.ylika || '',
    monoenergopoihsh: appointment?.monoenergopoihsh || 'ΟΧΙ',
    ontserial: appointment?.ontserial || '',
    aitiamholokl: appointment?.aitiamholokl || '',
    parentId: appointment?.parentId || '',
    parentType: appointment?.parentType || '',
    parentName: appointment?.parentName || '',
    assignedUserId: appointment?.assignedUserId || '',
    aDDRESSStreet: appointment?.aDDRESSStreet || '',
    onomatepwnymo: appointment?.onomatepwnymo || '',
    customerMobile: appointment?.customerMobile || '',
    photosIds: appointment?.photosIds || [],
    photosNames: appointment?.photosNames || {},
    photosTypes: appointment?.photosTypes || {},
    assignedUserName: appointment?.assignedUserName || '', // Add this line if not already present
  };

  const [formData, setFormData] = useState<LastDropAppointment>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('installation');
  const tabs = [
    { id: 'installation', label: 'Στοιχεία Εγκατάστασης', icon: Construction },
    { id: 'materials', label: 'Υλικά', icon: Package },
    { id: 'activation', label: 'Ενεργοποίηση', icon: Wifi },
    { id: 'attachments', label: 'Επισυναπτόμενα', icon: FileText },
    { id: 'closing', label: 'Κλείσιμο', icon: Send }
  ];

  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<LastDropAppointment | null>(null);

  // Initialize edit mode data
  useEffect(() => {
    if (appointment?.id) {
      setOriginalData(formData);
    }
  }, [appointment?.id, formData]);

  // Load appointment data
  useEffect(() => {
    const loadAppointment = async () => {
    if (appointment?.id) {
        try {
        console.log('Loading LastDrop appointment with ID:', appointment.id);
        const data = await lastDropAppointmentService.getAppointmentById(appointment.id);
        console.log('Loaded LastDrop appointment data:', data);
        
        // Ensure type compatibility
        const formattedData: LastDropAppointment = {
            ...data,
            id: data.id || '',
            assignedUserName: '', // You may want to fetch this separately
            photosIds: data.photosIds || [],
            photosNames: data.photosNames || {},
            photosTypes: data.photosTypes || {}
        };
        
        setFormData(formattedData);
        } catch (error) {
        console.error('Error loading LastDrop appointment:', error);
        }
    }
    };
  
    if (isOpen) {
      loadAppointment();
    }
  }, [appointment?.id, isOpen]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!isEditMode) return;
    
    const { name, value } = e.target;
    
    setHasChanges(true);
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      setOriginalData(formData);
    } else {
      if (hasChanges) {
        setShowConfirmDialog(true);
      } else {
        setIsEditMode(false);
      }
    }
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    if (originalData) {
      setFormData(originalData);
    }
    setIsEditMode(false);
    setHasChanges(false);
    setShowConfirmDialog(false);
  };

  const handleConfirmChanges = async () => {
    try {
      await handleSubmit();
      setIsEditMode(false);
      setHasChanges(false);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };

  const isFileList = (files: FileList | File[] | undefined): files is FileList => {
    return files instanceof FileList;
  };
  
  const isFileArray = (files: FileList | File[] | undefined): files is File[] => {
    return Array.isArray(files);
  };
  
  const convertToFileArray = (files: FileList | File[] | undefined): File[] => {
    if (isFileList(files)) {
      return Array.from(files);
    }
    return files || [];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = e.target.files;
      const newFiles = Array.from(fileList).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return isValidType && isValidSize;
      });
  
      setFiles(prev => [...prev, ...newFiles]);
      
      // Generate previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const BASE_URL = "http://192.168.4.150:8080/api/v1";
  
  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      if (!attachmentId) return;
      
      await fetch(`${BASE_URL}/Attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
  
      setFormData((prev: LastDropAppointment): LastDropAppointment => {
        const newPhotosNames = { ...prev.photosNames } as Record<string, string>;
        delete newPhotosNames[attachmentId];

        const newPhotosTypes = { ...prev.photosTypes } as Record<string, string>;
        delete newPhotosTypes[attachmentId];
  
        return {
          ...prev,
          photosIds: (prev.photosIds || []).filter(id => id !== attachmentId),
          photosNames: newPhotosNames,
          photosTypes: newPhotosTypes
        };
      });
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving LastDrop appointment:', error);
      throw error;
    }
  };

  const renderInstallationFields = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Left Column */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
          <Construction className="h-5 w-5 text-gray-500" />
          Στοιχεία Εγκατάστασης
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Τύπος Εργασίας</label>
            {isEditMode ? (
              <select 
                name="tiposergasias"
                value={formData.tiposergasias}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {TIPOSERGASIAS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {TIPOSERGASIAS_OPTIONS.find(option => option.value === formData.tiposergasias)?.label || formData.tiposergasias}
              </span>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Είδος Ίνας</label>
            {isEditMode ? (
              <select 
                name="eidosinas"
                value={formData.eidosinas}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {EIDOSINAS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {EIDOSINAS_OPTIONS.find(option => option.value === formData.eidosinas)?.label || formData.eidosinas}
              </span>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>ONT</label>
            {isEditMode ? (
              <select 
                name="ont"
                value={formData.ont}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {ONT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {ONT_OPTIONS.find(option => option.value === formData.ont)?.label || formData.ont}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
          <Wifi className="h-5 w-5 text-gray-500" />
          Ενεργοποίηση
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Ενεργοποίηση</label>
            {isEditMode ? (
              <select 
                name="energopoihsh"
                value={formData.energopoihsh}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {YES_NO_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {YES_NO_OPTIONS.find(option => option.value === formData.energopoihsh)?.label || formData.energopoihsh}
              </span>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Μόνο Ενεργοποίηση</label>
            {isEditMode ? (
              <select 
                name="monoenergopoihsh"
                value={formData.monoenergopoihsh}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {YES_NO_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {YES_NO_OPTIONS.find(option => option.value === formData.monoenergopoihsh)?.label || formData.monoenergopoihsh}
              </span>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Serial ONT</label>
            {isEditMode ? (
              <input
                type="text"
                name="ontserial"
                value={formData.ontserial || ''}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Εισάγετε serial ONT"
              />
            ) : (
              <span className="block text-sm text-gray-900">
                {formData.ontserial || '-'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderMaterialsTab = () => (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
        <Package className="h-5 w-5 text-gray-500" />
        Υλικά
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Υλικά</label>
          {isEditMode ? (
            <textarea
              name="ylika"
              value={formData.ylika || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Περιγραφή υλικών που χρησιμοποιήθηκαν"
            />
          ) : (
            <span className="block text-sm text-gray-900 bg-white p-3 rounded border border-gray-200">
              {formData.ylika || 'Δεν έχουν καταχωρηθεί υλικά'}
            </span>
          )}
        </div>

        <div>
          <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Εμπλουτισμός</label>
          {isEditMode ? (
            <select 
              name="emploutismos"
              value={formData.emploutismos}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {YES_NO_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <span className="block text-sm text-gray-900">
              {YES_NO_OPTIONS.find(option => option.value === formData.emploutismos)?.label || formData.emploutismos}
            </span>
          )}
        </div>

        <div>
          <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Εξόδευση</label>
          {isEditMode ? (
            <select 
              name="exodeusi"
              value={formData.exodeusi}
              onChange={handleInputChange}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {YES_NO_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          ) : (
            <span className="block text-sm text-gray-900">
              {YES_NO_OPTIONS.find(option => option.value === formData.exodeusi)?.label || formData.exodeusi}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderActivationTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
          <Wifi className="h-5 w-5 text-gray-500" />
          Στοιχεία Ενεργοποίησης
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Ενεργοποίηση</label>
            {isEditMode ? (
              <select 
                name="energopoihsh"
                value={formData.energopoihsh}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {YES_NO_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {YES_NO_OPTIONS.find(option => option.value === formData.energopoihsh)?.label || formData.energopoihsh}
              </span>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Μόνο Ενεργοποίηση</label>
            {isEditMode ? (
              <select 
                name="monoenergopoihsh"
                value={formData.monoenergopoihsh}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {YES_NO_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {YES_NO_OPTIONS.find(option => option.value === formData.monoenergopoihsh)?.label || formData.monoenergopoihsh}
              </span>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Serial ONT</label>
            {isEditMode ? (
              <input
                type="text"
                name="ontserial"
                value={formData.ontserial || ''}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Εισάγετε serial ONT"
              />
            ) : (
              <span className="block text-sm text-gray-900">
                {formData.ontserial || '-'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
          <AlertCircle className="h-5 w-5 text-gray-500" />
          Πρόσθετες Πληροφορίες
        </h3>
        <div className="space-y-4">
          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Αιτία Ολοκλήρωσης</label>
            {isEditMode ? (
              <select 
                name="aitiamholokl"
                value={formData.aitiamholokl || ''}
                onChange={handleInputChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Επιλέξτε αιτία</option>
                {AITIAMHOLOKL_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className="block text-sm text-gray-900">
                {AITIAMHOLOKL_OPTIONS.find(option => option.value === formData.aitiamholokl)?.label || formData.aitiamholokl || '-'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttachmentsTab = () => {
    // Transform photosIds and photosNames into AttachmentFile array
    const attachments = formData.photosIds?.map(id => ({
      id,
      name: formData.photosNames?.[id] || `Photo ${id}`,
      type: formData.photosTypes?.[id] || 'image/jpeg',
    })) || [];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileChange(e);
      }
    };

    return (
      <div className="p-4">
        <div className="mb-4">
          <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-2`}>
            Φωτογραφίες Εγκατάστασης
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Ανεβάστε φωτογραφίες από την εγκατάσταση για καλύτερη τεκμηρίωση
          </p>
        </div>
        
        <AttachmentHandlers
          attachments={attachments}
          onDelete={handleDeleteAttachment}
          onFileUpload={handleFileUpload}
          isEditMode={isEditMode}
        />

        {/* Photo Gallery Preview */}
        {attachments.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">Προεπισκόπηση Φωτογραφιών</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  <a 
                    href={`${BASE_URL}/Attachment/${attachment.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <img 
                      src={`${BASE_URL}/Attachment/${attachment.id}`}
                      alt={attachment.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 text-xs text-gray-500 truncate">{attachment.name}</div>
                  </a>
                  {isEditMode && (
                    <button
                      onClick={() => handleDeleteAttachment(attachment.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Διαγραφή"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClosingTab = () => (
    <div className="p-4 space-y-4">
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
          <AlertCircle className="h-5 w-5 text-gray-500" />
          Κατάσταση Εργασίας
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Κατάσταση</label>
            {isEditMode ? (
              <select 
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${getStatusStyle(formData.status)}`}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            ) : (
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(formData.status)}`}>
                {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || formData.status}
              </span>
            )}
          </div>

          {formData.status === 'ΟΛΟΚΛΗΡΩΣΗ' && (
            <div>
              <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>Αιτία Ολοκλήρωσης</label>
              {isEditMode ? (
                <select 
                  name="aitiamholokl"
                  value={formData.aitiamholokl || ''}
                  onChange={handleInputChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {AITIAMHOLOKL_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              ) : (
                <span className="block text-sm text-gray-900">
                  {AITIAMHOLOKL_OPTIONS.find(option => option.value === formData.aitiamholokl)?.label || formData.aitiamholokl || 'ΟΛΟΚΛΗΡΩΣΗ'}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <h3 className={`${inter.className} text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2`}>
          <FileText className="h-5 w-5 text-gray-500" />
          Σχόλια & Παρατηρήσεις
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
              Σχόλια
            </label>
            {isEditMode ? (
              <textarea
                name="comments"
                value={formData.comments || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Προσθέστε σχόλια ή παρατηρήσεις..."
              />
            ) : (
              <div className="bg-white p-4 rounded-md border border-gray-200 min-h-[100px]">
                {formData.comments || 'Δεν υπάρχουν σχόλια'}
              </div>
            )}
          </div>

          <div>
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
              Περιγραφή
            </label>
            {isEditMode ? (
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Προσθέστε περιγραφή..."
              />
            ) : (
              <div className="bg-white p-4 rounded-md border border-gray-200 min-h-[100px]">
                {formData.description || 'Δεν υπάρχει περιγραφή'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const getStatusStyle = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.style || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

      <div className="fixed inset-0 z-50 overflow-y-auto pt-20">
        <div className="flex min-h-[calc(100vh-8rem)] items-start justify-center p-4">
          {/* Modal Container */}
          <div className="relative w-[95vw] max-w-6xl bg-white rounded-lg shadow-xl my-8">
            {/* Content */}
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Διαχείριση Εγκατάστασης
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span className={inter.className}>
                      {formData.onomatepwnymo} - {formData.aDDRESSStreet}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-white border-b border-gray-200 px-4 py-2">
                <div className="flex items-center space-x-4">
                  <div className="w-72">
                    <label className={`${inter.className} block text-sm font-medium text-gray-700`}>
                      Κατάσταση
                    </label>
                    {isEditMode ? (
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className={`
                          ${inter.className} 
                          w-full rounded-md border-gray-300 shadow-sm 
                          focus:border-blue-500 focus:ring-blue-500
                          text-sm py-1.5 ${getStatusStyle(formData.status)}
                        `}
                      >
                        {STATUS_OPTIONS.map(option => (
                          <option 
                            key={option.value} 
                            value={option.value}
                            className={`${inter.className} text-gray-900`}
                          >
                            {option.label || option.value}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`
                        ${inter.className} 
                        block text-sm py-1.5 px-2 rounded-md
                        ${getStatusStyle(formData.status)}
                      `}>
                        {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || formData.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="sticky top-[73px] bg-white border-b border-gray-200 px-6">
                <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          ${inter.className}
                          border-b-2 py-4 px-1 text-sm font-medium transition-colors
                          inline-flex items-center space-x-2
                          ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                          }
                        `}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Main Content - Scrollable */}
              <form onSubmit={handleSubmit}>
                <div className="flex-1 px-6 py-4 overflow-y-auto custom-scrollbar" style={{ height: 'calc(85vh - 240px)' }}>
                  {/* Tab Content */}
                  {activeTab === 'installation' && renderInstallationFields()}
                  {activeTab === 'materials' && renderMaterialsTab()}
                  {activeTab === 'activation' && renderActivationTab()}
                  {activeTab === 'attachments' && renderAttachmentsTab()}
                  {activeTab === 'closing' && renderClosingTab()}
                </div>

                {/* Fixed Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className={`${inter.className} text-sm text-gray-500`}>
                        Τελευταία τροποποίηση: {new Date().toLocaleDateString('el-GR')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {!isEditMode ? (
                        <>
                          <button
                            type="button"
                            onClick={onClose}
                            className={`
                              ${inter.className}
                              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                              rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 
                              focus:ring-offset-2 focus:ring-blue-500 transition-colors
                            `}
                          >
                            Κλείσιμο
                          </button>
                          <button
                            type="button"
                            onClick={handleEditToggle}
                            className={`
                              ${inter.className}
                              px-4 py-2 text-sm font-medium text-white bg-blue-600 border 
                              border-transparent rounded-md shadow-sm hover:bg-blue-700 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                              transition-colors
                            `}
                          >
                            Επεξεργασία πληροφοριών
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className={`
                              ${inter.className}
                              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                              rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 
                              focus:ring-offset-2 focus:ring-blue-500 transition-colors
                            `}
                          >
                            Ακύρωση
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowConfirmDialog(true)}
                            className={`
                              ${inter.className}
                              px-4 py-2 text-sm font-medium text-white bg-blue-600 border 
                              border-transparent rounded-md shadow-sm hover:bg-blue-700 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                              transition-colors
                            `}
                          >
                            Αποθήκευση
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confirmation Dialog */}
                <ConfirmDialog
                    isOpen={showConfirmDialog}
                    onClose={() => setShowConfirmDialog(false)}
                    onConfirm={handleConfirmChanges} title={''} message={''}                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageLastDropAppointmentModal;