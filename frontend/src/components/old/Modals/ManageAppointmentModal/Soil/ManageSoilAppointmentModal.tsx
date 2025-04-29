'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle,
  ClipboardCheck,
  Users,
  MapPin,
  Phone,
  Mail,
  Clock,
  Save,
  Edit,
  XCircle,
  Upload,
  Image,
  Loader2,
  Shovel,
  Ruler
} from 'lucide-react';

import { 
  STATUS_OPTIONS, 
  YES_NO_OPTIONS,
  SOIL_DIFFICULTY_OPTIONS,
  PLAKA_TYPES,
  BCP_TYPES
} from '@/constants/index';

import { soilAppointmentService } from '@/services/soilAppointment';
import { 
  SoilAppointmentPayload,
  YesNo,
  PlakaType
} from '@/types/appointment';
import AttachmentHandlers from '../AttachmentHandler';
import ConfirmDialog from '../ConfirmDialog';

const BASE_URL = "http://192.168.4.150:8080/api/v1";

const inter = Inter({ 
  subsets: ['latin', 'greek'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const MODAL_TABS = [
  { id: 'customer', label: 'Στοιχεία Πελάτη', icon: Users },
  { id: 'soil', label: 'Χωματουργικά', icon: Shovel },
  { id: 'plaka', label: 'Πλάκες', icon: Construction },
  { id: 'closing', label: 'Κλείσιμο', icon: ClipboardCheck }
];

interface SoilAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: SoilAppointmentPayload;
  onSave: (data: SoilAppointmentPayload) => Promise<void>;
}

const ManageSoilAppointmentModal: React.FC<SoilAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave
}) => {
  // Initialize form data with proper typing
  const initialFormData: SoilAppointmentPayload = {
    id: appointment?.id || '',
    name: appointment?.name || '',
    status: appointment?.status || 'ΑΠΟΣΤΟΛΗ',
    dateStart: appointment?.dateStart || new Date().toISOString(),
    dateEnd: appointment?.dateEnd || new Date().toISOString(),
    isAllDay: appointment?.isAllDay || false,
    duration: appointment?.duration || 7200,
    description: appointment?.description || '',
    
    // Required fields for API
    parentId: appointment?.parentId || '',
    parentType: appointment?.parentType || '',
    parentName: appointment?.parentName || '',
    teamId: appointment?.teamId || '',
    sr: appointment?.sr || '',
    assignedUserId: appointment?.assignedUserId || '',
    sol: appointment?.sol || '',
    
    // Soil specific fields
    mikosChwma: appointment?.mikosChwma || '',
    difficultyLevel: appointment?.difficultyLevel || '',
    garden: (appointment?.garden || 'ΟΧΙ') as YesNo,
    emfyshsh: (appointment?.emfyshsh || 'ΟΧΙ') as YesNo,
    skapsimo: (appointment?.skapsimo || 'ΟΧΙ') as YesNo,
    egineemf: (appointment?.egineemf || 'ΟΧΙ') as YesNo,
    
    // Plaka fields
    typosPlakas: appointment?.typosPlakas || '',
    megethosPlakas: appointment?.megethosPlakas || '',
    alloMegethos: appointment?.alloMegethos || '',
    
    // BCP fields
    needBCP: (appointment?.needBCP || 'ΟΧΙ') as YesNo,
    eidosBcp: appointment?.eidosBcp || '',
    
    // Customer details
    customerName: appointment?.customerName || '',
    customerMobile: appointment?.customerMobile || '',
    
    // Location details
    mapsurl: appointment?.mapsurl || '',
    cordX: appointment?.cordX || '',
    
    // Attachments
    attachmentIds: appointment?.attachmentIds || [],
    attachmentNames: appointment?.attachmentNames || {},
    attachmentTypes: appointment?.attachmentTypes || {},
    
    // System fields
    dothike: appointment?.dothike || 0,
    photos: appointment?.photos || '',
    photoLink: appointment?.photoLink || '',
    testRecordId: appointment?.testRecordId || '',
    
    // Arrays
    inci: appointment?.inci || [],
    
    // Additional fields required by the component
    xrewsh: (appointment?.xrewsh || 'ΟΧΙ') as YesNo,
    diaxeirisi: appointment?.diaxeirisi || '',
    
    // Fields with defaults to avoid TypeScript errors
    address: '',
    perioxi: '',
    cabAddress: appointment?.cabAddress || '',
    
    // Add properties with any to accommodate API response fields not in the type
    cordy: (appointment as any)?.cordy || '',
    cordY: (appointment as any)?.cordY || '',
    aytopsia: (appointment as any)?.aytopsia || '',
    logosAporripshs: (appointment as any)?.logosAporripshs || '',
    logosMhOloklhrwshs: (appointment as any)?.logosMhOloklhrwshs || '',
    existingBCP: (appointment as any)?.existingBCP || ''
  };

  const [formData, setFormData] = useState<SoilAppointmentPayload & Record<string, any>>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('customer');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<(SoilAppointmentPayload & Record<string, any>) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

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
          console.log('Loading soil appointment with ID:', appointment.id);
          const data = await soilAppointmentService.getAppointmentById(appointment.id);
          console.log('Loaded soil appointment data:', data);

          // Process the data
          const processedData = {
            ...data,
            // Ensure cordy/cordY consistency
            cordY: data.cordY || data.cordy
          };
          
          setFormData(processedData);
          
          // Process attachment previews
          if (data.attachmentIds && data.attachmentIds.length > 0) {
            // Filter for image attachments to show in previews
            const imageAttachmentIds = data.attachmentIds.filter(id => {
              const contentType = data.attachmentTypes?.[id] || '';
              return contentType.startsWith('image/');
            });
            
            if (imageAttachmentIds.length > 0) {
              const previewUrls = imageAttachmentIds.map(id => `${BASE_URL}/Attachment/${id}`);
              setPreviews(previewUrls);
            }
          }
        } catch (error) {
          console.error('Error loading soil appointment:', error);
        }
      }
    };
  
    if (isOpen) {
      loadAppointment();
    }
  }, [appointment?.id, isOpen]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Required field validation
    const requiredFields = ['dateStart', 'dateEnd', 'name'];
    requiredFields.forEach(field => {
      if (!formData[field as keyof SoilAppointmentPayload]) {
        newErrors[field] = 'Το πεδίο είναι υποχρεωτικό';
      }
    });

    // Validate soil specific fields
    if (formData.egineemf === 'ΝΑΙ' || formData.skapsimo === 'ΝΑΙ') {
      if (!formData.mikosChwma) {
        newErrors['mikosChwma'] = 'Το πεδίο είναι υποχρεωτικό όταν έχει σκαφτεί';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      if (!attachmentId) return;
      
      await fetch(`${BASE_URL}/Attachment/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });
  
      setFormData((prev) => {
        const newAttachmentNames = { ...prev.attachmentNames } as Record<string, string>;
        const newAttachmentTypes = { ...prev.attachmentTypes } as Record<string, string>;
        delete newAttachmentNames[attachmentId];
        delete newAttachmentTypes[attachmentId];
  
        return {
          ...prev,
          attachmentIds: (prev.attachmentIds || []).filter(id => id !== attachmentId),
          attachmentNames: newAttachmentNames,
          attachmentTypes: newAttachmentTypes
        };
      });

      // Remove from previews if it exists
      if (previews.includes(`${BASE_URL}/Attachment/${attachmentId}`)) {
        setPreviews(prev => prev.filter(p => p !== `${BASE_URL}/Attachment/${attachmentId}`));
      }

      setHasChanges(true);
    } catch (error) {
      console.error('Error deleting attachment:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && isEditMode) {
      const fileList = e.target.files;
      const newFiles = Array.from(fileList).filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return isValidType && isValidSize;
      });
      
      // Add the new files to our state
      setFiles(prev => [...prev, ...newFiles]);
      
      // Generate previews for new files
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setHasChanges(true);
    }
  };

  const removeFile = (index: number) => {
    // Determine if this is a newly added file or an existing attachment
    const isExistingAttachment = index >= files.length;
    
    if (isExistingAttachment) {
      // For existing attachments (those from the server)
      const attachmentIndex = index - files.length;
      const attachmentId = formData.attachmentIds?.[attachmentIndex];
      
      if (attachmentId) {
        // Delete the attachment from the server
        handleDeleteAttachment(attachmentId);
      }
    } else {
      // For newly added files (not yet uploaded)
      setFiles(prev => prev.filter((_, i) => i !== index));
      // Remove the preview
      setPreviews(prev => {
        const newPreviews = [...prev];
        newPreviews.splice(index, 1);
        return newPreviews;
      });
    }
    
    setHasChanges(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    
    try {
      // Create a payload with the form data
      const payload = {
        ...formData
      };

      // Handle image attachments
      if (files.length > 0) {
        // Create FormData for file upload handling
        const formDataUpload = new FormData();
        
        // Append each file with a unique name
        files.forEach((file, index) => {
          formDataUpload.append(`files[${index}]`, file);
        });
        
        // Set the attachmentUploads to be processed by the API service
        payload.attachmentUploads = files;
      }

      await onSave(payload);
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        setIsEditMode(false);
        setHasChanges(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving appointment:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Status color styles
  const getStatusStyle = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.style || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Format the date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('el-GR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Custom form field component for consistency
  const FormField = ({ 
    label, 
    name, 
    value, 
    onChange,
    type = 'text',
    options = [],
    placeholder = '',
    error = '',
    disabled = false,
    required = false
  }: {
    label: string,
    name: string,
    value: any,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void,
    type?: 'text' | 'number' | 'select' | 'textarea' | 'date',
    options?: Array<{value: string, label: string}>,
    placeholder?: string,
    error?: string,
    disabled?: boolean,
    required?: boolean
  }) => {
    const isViewMode = !isEditMode;
    const labelClassName = `${inter.className} block text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'} mb-1`;
    const inputClassName = `w-full rounded-md ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm transition-colors duration-200`;
    
    const getValueDisplay = () => {
      if (type === 'select') {
        const option = options.find(opt => opt.value === value);
        return option ? option.label : value;
      }
      return value;
    };
    
    return (
      <div className="mb-4">
        <label htmlFor={name} className={labelClassName}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {isViewMode ? (
          <span className={`${inter.className} block text-sm text-gray-900 py-2 px-1`}>
            {getValueDisplay() || '-'}
          </span>
        ) : (
          <>
            {type === 'text' && (
              <input
                type="text"
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={inputClassName}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
            
            {type === 'number' && (
              <input
                type="number"
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={inputClassName}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
            
            {type === 'select' && (
              <select
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={inputClassName}
                disabled={disabled}
              >
                <option value="">{placeholder || 'Επιλέξτε...'}</option>
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            {type === 'textarea' && (
              <textarea
                id={name}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={`${inputClassName} min-h-[80px]`}
                placeholder={placeholder}
                disabled={disabled}
              />
            )}
            
            {type === 'date' && (
              <input
                type="date"
                id={name}
                name={name}
                value={value ? value.split(' ')[0] : ''}
                onChange={onChange}
                className={inputClassName}
                disabled={disabled}
              />
            )}
          </>
        )}
        
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  };

  // Card component for grouping related fields
  const Card = ({ 
    title, 
    icon: Icon, 
    children 
  }: { 
    title: string, 
    icon: React.ElementType, 
    children: React.ReactNode 
  }) => {
    return (
      <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className={`${inter.className} text-lg font-semibold text-gray-800 flex items-center gap-2`}>
            <Icon className="h-5 w-5 text-yellow-600" />
            {title}
          </h3>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    );
  };

  // Specific tab content renderers
  const renderCustomerTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Στοιχεία Πελάτη" icon={Users}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Όνομα Πελάτη"
            name="customerName"
            value="Όνομα Πελάτη"
            onChange={handleInputChange}
            required
          />
          <FormField
            label="Τηλέφωνο Πελάτη"
            name="customerMobile"
            value="69xxxxxxxx"
            onChange={handleInputChange}
          />
        </div>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="SR"
            name="sr"
            value={formData.sr}
            onChange={handleInputChange}
          />
          <FormField
            label="SOL"
            name="sol"
            value={formData.sol}
            onChange={handleInputChange}
          />
        </div>
      </Card>
      
      <Card title="Στοιχεία Ραντεβού" icon={Calendar}>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Ημερομηνία Έναρξης"
            name="dateStart"
            value={formData.dateStart}
            onChange={handleInputChange}
            type="date"
            required
          />
          <FormField
            label="Ημερομηνία Λήξης"
            name="dateEnd"
            value={formData.dateEnd}
            onChange={handleInputChange}
            type="date"
            required
          />
          <FormField
            label="Περιγραφή"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            type="textarea"
          />
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="isAllDay"
              name="isAllDay"
              checked={formData.isAllDay}
              onChange={(e) => setFormData(prev => ({ ...prev, isAllDay: e.target.checked }))}
              className="h-4 w-4 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
              disabled={!isEditMode}
            />
            <label htmlFor="isAllDay" className="ml-2 block text-sm text-gray-700">
              Ολοήμερο
            </label>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderSoilTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Στοιχεία Χωματουργικού" icon={Shovel}>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Μήκος Χωματουργικού"
            name="mikosChwma"
            value={formData.mikosChwma}
            onChange={handleInputChange}
            type="number"
            error={errors.mikosChwma}
          />
          
          <FormField
            label="Δυσκολία"
            name="difficultyLevel"
            value={formData.difficultyLevel}
            onChange={handleInputChange}
            type="select"
            options={SOIL_DIFFICULTY_OPTIONS}
          />
          
          <FormField
            label="Έγινε Σκάψιμο"
            name="skapsimo"
            value={formData.skapsimo}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
          />
          
          <FormField
            label="Έγινε Έμφυση"
            name="emfyshsh"
            value={formData.emfyshsh}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
          />
          
          <FormField
            label="Έγινε Εμφύσηση"
            name="egineemf"
            value={formData.egineemf}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
          />
        </div>
      </Card>
      
    </div>
  );

  const renderPlakaTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Στοιχεία Πλάκας" icon={Construction}>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Τύπος Πλάκας"
            name="typosPlakas"
            value={formData.typosPlakas}
            onChange={handleInputChange}
            type="select"
            options={PLAKA_TYPES}
          />
          
          {formData.typosPlakas && (
            <>
              <FormField
                label="Μέγεθος Πλάκας"
                name="megethosPlakas"
                value={formData.megethosPlakas}
                onChange={handleInputChange}
                type="text"
              />
              
              {formData.megethosPlakas === 'ΑΛΛΟ' && (
                <FormField
                  label="Άλλο Μέγεθος"
                  name="alloMegethos"
                  value={formData.alloMegethos}
                  onChange={handleInputChange}
                  type="text"
                />
              )}
            </>
          )}
        </div>
      </Card>
      
      <Card title="Στοιχεία BCP" icon={Construction}>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Χρειάζεται BCP"
            name="needBCP"
            value={formData.needBCP}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
          />
          
          {formData.needBCP === 'ΝΑΙ' && (
            <FormField
              label="Είδος BCP"
              name="eidosBcp"
              value={formData.eidosBcp}
              onChange={handleInputChange}
              type="select"
              options={BCP_TYPES}
            />
          )}
          
          <FormField
            label="Υπάρχον BCP"
            name="existingBCP"
            value={formData.existingBCP || ''}
            onChange={handleInputChange}
            type="text"
          />
        </div>
      </Card>
      
      <Card title="Φωτογραφίες" icon={Image}>
        <div>
          {isEditMode && (
            <div className="mb-4">
              <label 
                htmlFor="photo-upload" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 cursor-pointer"
              >
                <Upload className="h-4 w-4 mr-2" />
                Προσθήκη Φωτογραφιών
              </label>
              <input 
                id="photo-upload" 
                type="file" 
                className="hidden" 
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
            </div>
          )}
          
          {previews.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`}
                    className="h-24 w-full object-cover rounded-lg border border-gray-200"
                  />
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">Δεν υπάρχουν φωτογραφίες</p>
          )}
        </div>
      </Card>
    </div>
  );

  const renderAttachmentsTab = () => {
    const attachments = formData.attachmentIds?.map(id => ({
      id,
      name: formData.attachmentNames?.[id] || `File ${id}`,
      type: formData.attachmentTypes?.[id] || '',
    })) || [];

    return (
      <div className="space-y-6">
        <Card title="Επισυναπτόμενα Αρχεία" icon={FileText}>
          <AttachmentHandlers
            attachments={attachments}
            onDelete={handleDeleteAttachment}
            onFileUpload={handleFileChange}
            isEditMode={isEditMode}
          />
        </Card>
        
        {formData.aytopsia && (
          <Card title="Σχετικές Αναφορές" icon={FileText}>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
              <div dangerouslySetInnerHTML={{ __html: formData.aytopsia }} />
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderClosingTab = () => (
    <div className="space-y-6">
      
      <Card title="Σχόλια" icon={FileText}>
        <FormField
          label="Περιγραφή"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          type="textarea"
          placeholder="Προσθέστε σχόλια ή παρατηρήσεις..."
        />
      </Card>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-start justify-center p-4 text-center sm:p-0">
          {/* Modal Container */}
          <div className="relative transform overflow-hidden rounded-lg bg-aspro text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
            {/* Content */}
            <div className="flex flex-col h-screen max-h-[90vh]">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-yellow-600 to-yellow-800 px-6 py-4 text-white shadow">
                <div className="flex items-center justify-between">
                  <h2 className={`${inter.className} text-xl font-semibold flex items-center gap-2`}>
                    <Shovel className="h-5 w-5" />
                    Διαχείριση Χωματουργικού
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-white text-sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className={inter.className}>{formData.address || 'Χωρίς διεύθυνση'}</span>
                    </div>
                    <button
                      onClick={onClose}
                      className="ml-4 rounded-full p-1 hover:bg-yellow-700 focus:outline-none transition-colors duration-150"
                      aria-label="Κλείσιμο"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="bg-aspro border-b border-gray-200 px-6 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className={`${inter.className} block text-xs font-medium text-gray-500 mb-1`}>
                        Κατάσταση
                      </label>
                      {isEditMode ? (
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className={`
                            ${inter.className} 
                            rounded-md border-gray-300 shadow-sm 
                            focus:border-blue-500 focus:ring-blue-500
                            text-sm py-1.5 px-3 
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
                          inline-block text-sm py-1 px-3 rounded-full
                          ${getStatusStyle(formData.status)}
                        `}>
                          {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || formData.status}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className={`${inter.className} block text-xs font-medium text-gray-500 mb-1`}>
                        Ημερομηνία
                      </label>
                      <span className={`${inter.className} text-sm text-gray-700 flex items-center`}>
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(formData.dateStart)}
                      </span>
                    </div>
                    <div>
                      <label className={`${inter.className} block text-xs font-medium text-gray-500 mb-1`}>
                        SR
                      </label>
                      <span className={`${inter.className} text-sm text-gray-700 flex items-center`}>
                        <FileText className="h-4 w-4 mr-1 text-gray-400" />
                        {formData.sr || '-'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    {!isEditMode ? (
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md 
                                shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 
                                focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                      >
                        <Edit className="h-4 w-4 mr-1" /> 
                        Επεξεργασία
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md 
                                 text-gray-700 bg-aspro hover:bg-gray-50 focus:outline-none focus:ring-2 
                                focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Ακύρωση
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmDialog(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md 
                                shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 
                                focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Αποθήκευση
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="sticky top-[113px] z-10 bg-aspro border-b border-gray-200 shadow-sm">
                <nav className="flex space-x-1 px-6 overflow-x-auto scrollbar-hide">
                  {MODAL_TABS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          ${inter.className}
                          whitespace-nowrap border-b-2 py-3 px-3 text-sm font-medium transition-colors
                          flex items-center space-x-2
                          ${activeTab === tab.id
                            ? 'border-yellow-500 text-yellow-600'
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
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="px-6 py-4 bg-gray-50 min-h-[400px]">
                  {activeTab === 'customer' && renderCustomerTab()}
                  {activeTab === 'soil' && renderSoilTab()}
                  {activeTab === 'plaka' && renderPlakaTab()}
                  {activeTab === 'attachments' && renderAttachmentsTab()}
                  {activeTab === 'closing' && renderClosingTab()}
                </div>
              </form>

              {/* Fixed Footer */}
              <div className="bg-aspro px-6 py-3 border-t border-gray-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className={inter.className}>
                      Τελευταία τροποποίηση: {formatDate(formData.modifiedAt || new Date().toISOString())}
                    </span>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`
                        ${inter.className}
                        px-4 py-2 text-sm font-medium text-gray-700 bg-aspro border border-gray-300 
                        rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 
                        focus:ring-offset-2 focus:ring-yellow-500 transition-colors
                      `}
                    >
                      Κλείσιμο
                    </button>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={() => setShowConfirmDialog(true)}
                        className={`
                          ${inter.className}
                          px-4 py-2 text-sm font-medium text-white bg-yellow-600 border 
                          border-transparent rounded-md shadow-sm hover:bg-yellow-700 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500
                          transition-colors
                        `}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <span className="flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Αποθήκευση...
                          </span>
                        ) : (
                          "Αποθήκευση"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="absolute bottom-20 right-6 bg-green-50 border border-green-200 text-green-800 rounded-lg 
                              shadow-lg px-4 py-3 flex items-center animate-fade-in">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  <span className={`${inter.className} font-medium`}>Οι αλλαγές αποθηκεύτηκαν με επιτυχία!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleConfirmChanges} 
        title="Αποθήκευση Αλλαγών"
        message="Είστε σίγουροι ότι θέλετε να αποθηκεύσετε τις αλλαγές;"
      />
    </div>
  );
};

export default ManageSoilAppointmentModal;