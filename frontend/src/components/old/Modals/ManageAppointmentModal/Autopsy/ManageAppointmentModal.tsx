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
  CheckCircle,
  ClipboardCheck,
  Users,
  MapPin,
  Home,
  Clock,
  Save,
  Edit,
  XCircle,
  Upload,
  Loader2,
  User,
  Clipboard,
  Settings,
  PencilRuler
} from 'lucide-react';

import { 
  STATUS_OPTIONS, 
  YES_NO_OPTIONS,
  PLAKA_TYPES,
  BCP_TYPES,
  CUSTOMER_FLOOR_OPTIONS,
  SOIL_DIFFICULTY_OPTIONS,
  VALIDATION_MESSAGES
} from '@/constants/index';

import { appointmentService } from '@/services/autopsyAppointment';
import { FloorCount, TestAppointment, YesNo } from '@/types/appointment';
import AttachmentHandlers from '../AttachmentHandler';
import ConfirmDialog from '../ConfirmDialog';

// Define Inter font with both Greek and Latin subsets
const inter = Inter({ 
  subsets: ['latin', 'greek'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Validation utility with proper typing
const isFieldRequired = (fieldName: string, values: TestAppointment): boolean => {
  switch (fieldName) {
    case 'dateStart':
    case 'dateEnd':
      return true;
    case 'dog':
      return !!values.customerfloor;
    case 'floors':
    case 'needBCP':
    case 'blowJob':
    case 'earthworkGarden':
    case 'apartCode':
    case 'kya':
      return values.status === 'ΟΛΟΚΛΗΡΩΣΗ';
    case 'nearBCP':
      return values.needBCP === 'ΝΑΙ' && values.status === 'ΟΛΟΚΛΗΡΩΣΗ';
    case 'mhkosXwmatourgikou':
      return values.earthWork === 'ΝΑΙ';
    case 'selectdiamerismata1':
      return !!values.selctorofos1;
    case 'selctorofos1':
      return !!values.customerfloor;
    case 'anamoniypografhs':
    case 'anamoniwfm':
      return values.status === 'ΟΛΟΚΛΗΡΩΣΗ' && values.ekswsysthmikh !== 'ΝΑΙ';
    case 'posoxrewshs':
      return values.xrewsh === 'ΝΑΙ';
    default:
      return false;
  }
};

const isFieldVisible = (fieldName: string, values: TestAppointment): boolean => {
  switch (fieldName) {
    // Floor section visibility
    case 'floors':
      return true;
    case 'customerfloor':
      return !!values.floors;
    case 'selctorofos1':
    case 'selectdiamerismata1':
    case 'selectfloorbox1':
    case 'dog':
      return !!values.customerfloor;
    
    // Floors 2-10 visibility (based on previous floor being filled)
    case 'selectorofos2':
      return !!values.selectdiamerismata1 && values.floors !== '1';
    case 'selectdiamerismata2':
      return !!values.selectorofos2 && !!values.selectdiamerismata1;
    case 'selectfloorbox2':
      return !!values.selectdiamerismata2 && !!values.selectorofos2;
    
    // Construction section
    case 'nearBCP':
      return values.needBCP === 'ΝΑΙ';
    case 'eidosBcp':
      return values.nearBCP === 'ΝΑΙ' || values.needBCP === 'ΝΑΙ';
    case 'mhkosXwmatourgikou':
      return values.earthWork === 'ΝΑΙ';
    case 'typePlakas':
      return values.earthWork === 'ΝΑΙ' && !!values.mhkosXwmatourgikou;
    case 'megethosPlakas':
      return values.earthWork === 'ΝΑΙ' && !!values.typePlakas && !!values.mhkosXwmatourgikou;
    case 'alloPlaka':
      return values.megethosPlakas === 'ΑΛΛΟ';
    case 'photoPlakas':
      return values.earthWork === 'ΝΑΙ' && !!values.megethosPlakas && !!values.mhkosXwmatourgikou;

    // Related works section 
    case 'relatedChoma':
    case 'relatedKataskeyi':
    case 'relatedSplicing':
      return !!values.kataskeyasthke;

    // Technician appointment info
    case 'skafthke':
    case 'kataskeyasthke':
    case 'kollithike':
      return values.status === 'ΟΛΟΚΛΗΡΩΣΗ';

    // Smart readiness
    case 'smartpoints':
      return values.smartreadiness === 'ΝΑΙ';

    // Closing section fields
    case 'mioloklirisocuz':
      return values.status === 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ';
    case 'aitiaApor':
      return values.status === 'ΑΠΟΡΡΙΨΗ';
    case 'diaxeirisi':
      return true;
    case 'posoxrewshs':
      return values.xrewsh === 'ΝΑΙ';
    case 'anamoniwfm':
      return values.ekswsysthmikh !== 'ΝΑΙ';

    default:
      return true;
  }
};

const isFieldReadOnly = (fieldName: string): boolean => {
  // Fields that should be read-only regardless of edit mode
  const readOnlyFields = [
    'customername', 'customerMobille', 'address', 'perioxi', 
    'servicefloor', 'adminname', 'adminMobile', 'ttlp', 'ak',
    'bid', 'sxoliafrominspection', 'category'
  ];

  return readOnlyFields.includes(fieldName);
};

// Removed Smart Readiness tab from MODAL_TABS
const MODAL_TABS = [
  { id: 'appointment', label: 'Στοιχεία Αυτοψίας και Πελάτη', icon: Clipboard },
  { id: 'building', label: 'Στοιχεία Κτιρίου', icon: Building2 },
  { id: 'floors', label: 'Όροφοι', icon: Home },
  { id: 'soil', label: 'Χωματουργικά', icon: PencilRuler },
  { id: 'construction', label: 'Κατασκευαστικά', icon: Construction },
  { id: 'attachments', label: 'Επισυναπτόμενα', icon: FileText },
  { id: 'closing', label: 'Κλείσιμο', icon: ClipboardCheck }
];

// Define PLAKA_SIZES constant since it's not in your constants.ts
const PLAKA_SIZES = [
  { value: '', label: 'Επιλέξτε...' },
  { value: '40 x 40', label: '40 x 40' },
  { value: '50 x 50', label: '50 x 50' },
  { value: 'ΑΛΛΟ', label: 'ΑΛΛΟ' }
];

// Define COMPLETION_REASONS constants since it's not in your constants.ts
const COMPLETION_REASONS = [
  { value: '', label: 'Επιλέξτε...' },
  { value: 'ΔΕΝ ΕΠΙΘΥΜΕΙ', label: 'ΔΕΝ ΕΠΙΘΥΜΕΙ' },
  { value: 'ΔΕΝ ΕΧΕΙ ΟΛΟΚΛΗΡΩΘΕΙ Η ΠΟΛΥΚΑΤΟΙΚΙΑ', label: 'ΔΕΝ ΕΧΕΙ ΟΛΟΚΛΗΡΩΘΕΙ Η ΠΟΛΥΚΑΤΟΙΚΙΑ' },
  { value: 'ΔΕΝ ΥΠΑΡΧΕΙ Α\' ΦΑΣΗ', label: 'ΔΕΝ ΥΠΑΡΧΕΙ Α\' ΦΑΣΗ' },
  { value: 'ΛΑΝΘΑΣΜΕΝΗ ΔΙΕΥΘΥΝΣΗ', label: 'ΛΑΝΘΑΣΜΕΝΗ ΔΙΕΥΘΥΝΣΗ' },
  { value: 'ΛΑΝΘΑΣΜΕΝΟΣ ΟΡΟΦΟΣ', label: 'ΛΑΝΘΑΣΜΕΝΟΣ ΟΡΟΦΟΣ' },
  { value: 'ΥΠΑΡΧΕΙ Β\' ΦΑΣΗ', label: 'ΥΠΑΡΧΕΙ Β\' ΦΑΣΗ' }
];

// Define DIAXEIRISI_OPTIONS constant since it's not in your constants.ts
const DIAXEIRISI_OPTIONS = [
  { value: '', label: 'Επιλέξτε...' },
  { value: 'ΝΑΙ', label: 'ΝΑΙ' },
  { value: 'ΕΓΙΝΕ', label: 'ΕΓΙΝΕ' }
];

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: TestAppointment;
  onSave: (data: TestAppointment) => Promise<void>;
}

const ManageAppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSave
}) => {

const initialFormData: TestAppointment = {
  status: appointment?.status || 'ΑΠΟΣΤΟΛΗ',
  dateStart: appointment?.dateStart || new Date().toISOString(),
  dateEnd: appointment?.dateEnd || new Date().toISOString(),
  description: appointment?.description || '',
  isAllDay: appointment?.isAllDay || false,
  duration: appointment?.duration || 7200,
  sr: appointment?.sr || '',
  srText: appointment?.srText || '', // Add srText
  floors: appointment?.floors || '',
  customerfloor: appointment?.customerfloor || '',
  dog: appointment?.dog || 'ΟΧΙ',
  needBCP: appointment?.needBCP || '',
  nearBCP: appointment?.nearBCP || '',
  eidosBcp: appointment?.eidosBcp || '',
  earthWork: appointment?.earthWork || '',
  mhkosXwmatourgikou: appointment?.mhkosXwmatourgikou || '',
  typePlakas: appointment?.typePlakas || '',
  megethosPlakas: appointment?.megethosPlakas || '',
  alloPlaka: appointment?.alloPlaka || '',
  kagkela: appointment?.kagkela || '',
  kanali: appointment?.kanali || '',
  enaeria: appointment?.enaeria || '',
  dyskoliakat: appointment?.dyskoliakat || '',
  diaxeirisi: appointment?.diaxeirisi || '',
  xrewsh: appointment?.xrewsh || 'ΟΧΙ',
  posoxrewshs: appointment?.posoxrewshs || '',
  customername: appointment?.customername || '',
  customerMobille: appointment?.customerMobille || '',
  address: appointment?.address || '',
  perioxi: appointment?.perioxi || '',
  servicefloor: appointment?.servicefloor || '',
  apartCode: appointment?.apartCode || '',
  parentId: appointment?.parentId || '',
  parentType: appointment?.parentType || '',
  parentName: appointment?.parentName || '',
  name: appointment?.name || 'ΑΥΤΟΨΙΑ',
  // Floor arrays
  selectorofos: appointment?.selectorofos || [],
  selectdiamerismata: appointment?.selectdiamerismata || [],
  floorbox: appointment?.floorbox || [],
  // Building details
  bid: appointment?.bid || '',
  finalBuilding: appointment?.finalBuilding || '',
  // Admin details
  adminname: appointment?.adminname || '',
  adminMobile: appointment?.adminMobile || '',
  // Smart readiness
  smartreadiness: appointment?.smartreadiness || 'ΟΧΙ',
  // Closing details
  mioloklirisocuz: appointment?.mioloklirisocuz || '',
  aitiaApor: appointment?.aitiaApor || '',
  anamoniypografhs: appointment?.anamoniypografhs || '',
  anamoniwfm: appointment?.anamoniwfm || '',
  ekswsysthmikh: appointment?.ekswsysthmikh || '',
  // Construction related fields
  blowJob: appointment?.blowJob || '',
  earthworkGarden: appointment?.earthworkGarden || 'ΟΧΙ',
  skafthke: appointment?.skafthke || 'ΟΧΙ',
  kataskeyasthke: appointment?.kataskeyasthke || 'ΟΧΙ',
  kollithike: appointment?.kollithike || '',
  relatedChoma: appointment?.relatedChoma || '',
  relatedKataskeyi: appointment?.relatedKataskeyi || '',
  relatedSplicing: appointment?.relatedSplicing || '',
  kya: appointment?.kya || 'ΝΑΙ',
  // Additional fields
  ttlp: appointment?.ttlp || '',
  ak: appointment?.ak || '',
  category: appointment?.category || '',
  mapsurl: appointment?.mapsurl || '',
  cabaddress: appointment?.cabaddress || '',
  assignedUserId: appointment?.assignedUserId || '',
  sxoliafrominspection: appointment?.sxoliafrominspection || '',
  // Individual floor fields for backward compatibility
  selectdiamerismata1: appointment?.selectdiamerismata1 || 0,
  selctorofos1: appointment?.selctorofos1 || '',
  selectorofos1: appointment?.selectorofos1 || '',
  selectfloorbox1: appointment?.selectfloorbox1 || 1,
  selectorofos2: appointment?.selectorofos2 || '',
  selectdiamerismata2: appointment?.selectdiamerismata2 || 0,
  selectfloorbox2: appointment?.selectfloorbox2 || 1,
  // Attachment-related fields
  photoPlakas: appointment?.photoPlakas,
  attachmentIds: appointment?.attachmentIds || [],
  attachmentNames: appointment?.attachmentNames || {},
  attachmentTypes: appointment?.attachmentTypes || {},
  attachmentUploads: appointment?.attachmentUploads || [],
  floor: appointment?.floor
};

const [formData, setFormData] = useState<TestAppointment>(initialFormData);
const [errors, setErrors] = useState<Record<string, string>>({});
const [files, setFiles] = useState<File[]>([]);
const [activeTab, setActiveTab] = useState('appointment');
const [isEditMode, setIsEditMode] = useState(false);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [hasChanges, setHasChanges] = useState(false);
const [originalData, setOriginalData] = useState<TestAppointment | null>(null);
const [isSaving, setIsSaving] = useState(false);
const [showSuccessMessage, setShowSuccessMessage] = useState(false);
// State to keep track of previous tab before opening attachment view
const [previousTab, setPreviousTab] = useState('');

// Initialize edit mode data
useEffect(() => {
  if (appointment?.id) {
    setOriginalData({...formData});
  }
}, [appointment?.id]);

  // Load appointment data
useEffect(() => {
  const loadAppointment = async () => {
    if (appointment?.id) {
      try {
        console.log('Loading appointment with ID:', appointment.id);
        
        // Fetch appointment data using appointmentService
        const appointmentData = await appointmentService.getAppointmentById(appointment.id);
        
        // Fetch attachment data using direct fetch if needed
        try {
          // Create search params for the attachment query
          const params = {
            where: [
              {
                type: 'equals',
                attribute: 'parentId',
                value: appointment.id
              },
              {
                type: 'equals',
                attribute: 'parentType',
                value: 'Test'
              }
            ],
            select: ['id', 'name', 'type'] 
          };
          
          const searchParams = encodeURIComponent(JSON.stringify(params));
          
          // Make the fetch request for attachments
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.150:8080/api/v1'}/Attachment?searchParams=${searchParams}`, {
            headers: {
              'Authorization': `Basic ${localStorage.getItem('auth_token') || ''}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
          
          if (!response.ok) {
            throw new Error(`Error fetching attachments: ${response.statusText}`);
          }
          
          const responseData = await response.json();
          const attachmentsList = responseData.list || [];
          
          if (attachmentsList.length > 0) {
            // Update the attachment data in the appointment
            appointmentData.attachmentIds = attachmentsList.map((att: any) => att.id);
            
            // Create attachmentNames object
            appointmentData.attachmentNames = {};
            attachmentsList.forEach((att: any) => {
              if (appointmentData.attachmentNames) {
                appointmentData.attachmentNames[att.id] = att.name || `Attachment ${att.id}`;
              }
            });
            
            // Create attachmentTypes object
            appointmentData.attachmentTypes = {};
            attachmentsList.forEach((att: any) => {
              if (appointmentData.attachmentTypes) {
                appointmentData.attachmentTypes[att.id] = att.type || '';
              }
            });
          }
        } catch (attachmentError) {
          console.error('Error fetching attachments:', attachmentError);
          
          // Initialize empty attachment data if fetch fails
          appointmentData.attachmentIds = [];
          appointmentData.attachmentNames = {};
          appointmentData.attachmentTypes = {};
        }
        
        console.log('Loaded appointment data:', appointmentData);
        setFormData(appointmentData);
        
        // Store original data for detecting changes
        setOriginalData({...appointmentData});
      } catch (error) {
        console.error('Error loading appointment:', error);
      }
    }
  };

  loadAppointment();
}, [appointment?.id]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    Object.keys(formData).forEach(key => {
      const typedKey = key as keyof TestAppointment;
      
      // Only validate visible fields
      if (isFieldVisible(typedKey, formData)) {
        if (isFieldRequired(typedKey, formData)) {
          const value = formData[typedKey];
          
          // Check if value is empty
          const isEmpty = 
            value === undefined || 
            value === null || 
            value === '' || 
            (Array.isArray(value) && value.length === 0);
            
          if (isEmpty) {
            newErrors[key] = VALIDATION_MESSAGES.required;
          }
        }
      }
    });

    // Special validation rules
    if (formData.needBCP === 'ΝΑΙ' && !formData.nearBCP && formData.status === 'ΟΛΟΚΛΗΡΩΣΗ') {
      newErrors['nearBCP'] = VALIDATION_MESSAGES.required;
    }

    if (formData.xrewsh === 'ΝΑΙ' && !formData.posoxrewshs) {
      newErrors['posoxrewshs'] = VALIDATION_MESSAGES.required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!isEditMode) return;
    
    const { name, value, type } = e.target;
    
    // Check if the field is read-only
    if (isFieldReadOnly(name)) return;
    
    if (name === 'floors') {
      handleFloorCountChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }
  
    setHasChanges(true);
    
    // Handle checkbox values
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prevData => ({
        ...prevData,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
    
    // Handle conditional field logic
    if (name === 'earthWork' && value !== 'ΝΑΙ') {
      setFormData(prevData => {
        const newData = { ...prevData };
        newData.earthWork = value as YesNo;
        newData.mhkosXwmatourgikou = '';
        newData.typePlakas = '';
        newData.megethosPlakas = '';
        newData.alloPlaka = '';
        return newData;
      });
    }
    
    if (name === 'needBCP' && value !== 'ΝΑΙ') {
      setFormData(prevData => {
        const newData = { ...prevData };
        newData.needBCP = value as YesNo;
        newData.nearBCP = '';
        newData.eidosBcp = '';
        return newData;
      });
    }
  };

  const handleEditToggle = () => {
    if (!isEditMode) {
      setIsEditMode(true);
      setOriginalData({...formData});
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
      setFormData({...originalData});
    }
    setIsEditMode(false);
    setHasChanges(false);
    setShowConfirmDialog(false);
  };

  const handleFloorCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value as FloorCount; // Type assertion here
    const newFloorCount = parseInt(newValue) || 0;
    
    setFormData(prev => {
      // Create new arrays with the new length
      const newSelectorofos = new Array(newFloorCount).fill('');
      const newSelectdiamerismata = new Array(newFloorCount).fill(0);
      const newFloorbox = new Array(newFloorCount).fill(1);
      
      // Preserve existing values
      prev.selectorofos?.forEach((value, index) => {
        if (index < newFloorCount) {
          newSelectorofos[index] = value;
        }
      });
  
      prev.selectdiamerismata?.forEach((value, index) => {
        if (index < newFloorCount) {
          newSelectdiamerismata[index] = Number(value) || 0;
        }
      });
  
      prev.floorbox?.forEach((value, index) => {
        if (index < newFloorCount) {
          newFloorbox[index] = Number(value) || 1;
        }
      });
  
      const newData = { ...prev };
      newData.floors = newValue;
      newData.selectorofos = newSelectorofos;
      newData.selectdiamerismata = newSelectdiamerismata;
      newData.floorbox = newFloorbox;
      return newData;
    });
    
    setHasChanges(true);
  };
  
  const handleFloorFieldChange = (
    index: number,
    field: 'selectorofos' | 'selectdiamerismata' | 'floorbox',
    value: string | number
  ) => {
    setFormData(prev => {
      const newData = { ...prev };
      
      // Handle each field type appropriately
      if (field === 'selectorofos') {
        const newSelectorofos = [...(prev.selectorofos || [])];
        newSelectorofos[index] = value as string;
        newData.selectorofos = newSelectorofos;

        // Update individual floor fields for backward compatibility
        if (index === 0) {
          newData.selctorofos1 = value as string;
          // Now this is properly typed
          newData.selectorofos1 = value as string;
        } else if (index === 1) {
          newData.selectorofos2 = value as string;
        }
      } 
      else if (field === 'selectdiamerismata') {
        const newSelectdiamerismata = [...(prev.selectdiamerismata || [])];
        newSelectdiamerismata[index] = parseInt(value as string) || 0;
        newData.selectdiamerismata = newSelectdiamerismata;

        // Update individual floor fields for backward compatibility
        if (index === 0) {
          newData.selectdiamerismata1 = parseInt(value as string) || 0;
        } else if (index === 1) {
          newData.selectdiamerismata2 = parseInt(value as string) || 0;
        }
      }
      else if (field === 'floorbox') {
        const newFloorbox = [...(prev.floorbox || [])];
        newFloorbox[index] = parseInt(value as string) || 1;
        newData.floorbox = newFloorbox;

        // Update individual floor fields for backward compatibility
        if (index === 0) {
          newData.selectfloorbox1 = parseInt(value as string) || 1;
        } else if (index === 1) {
          newData.selectfloorbox2 = parseInt(value as string) || 1;
        }
      }

      return newData;
    });

    setHasChanges(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !isEditMode) return;
    
    const fileList = e.target.files;
    const newFiles = Array.from(fileList).filter(file => {
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValidType && isValidSize;
    });
    
    if (newFiles.length === 0) return;
    
    setFiles(prev => [...prev, ...newFiles]);
    setHasChanges(true);
    
    // Add to attachmentUploads
    setFormData(prev => {
      const newData = { ...prev };
      newData.attachmentUploads = [...(prev.attachmentUploads || []), ...newFiles];
      return newData;
    });
  };


  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      setHasChanges(true);
      
      // Remove from state first
      setFormData(prev => {
        // Create a new copy of the formData object
        const newData: TestAppointment = { ...prev };
        
        // Create a new array excluding the attachmentId to delete
        const newAttachmentIds = (prev.attachmentIds || []).filter(id => id !== attachmentId);
        newData.attachmentIds = newAttachmentIds;
        
        // Create a new copy of the attachmentNames object without the deleted attachment
        if (prev.attachmentNames) {
          const newNames = { ...prev.attachmentNames };
          delete newNames[attachmentId];
          newData.attachmentNames = newNames;
        }
        
        // Create a new copy of the attachmentTypes object without the deleted attachment
        if (prev.attachmentTypes) {
          const newTypes = { ...prev.attachmentTypes };
          delete newTypes[attachmentId];
          newData.attachmentTypes = newTypes;
        }
        
        return newData;
      });
      
      // Only attempt to delete if in edit mode and record exists in the database
      if (isEditMode && appointment?.id) {
        try {
          // Use direct fetch if api.deleteAttachment has type issues
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.150:8080/api/v1'}/Attachment/${attachmentId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Basic ${localStorage.getItem('auth_token') || ''}`,
            },
          });
  
          if (!response.ok) {
            throw new Error(`Error deleting attachment: ${response.statusText}`);
          }
          
          console.log('Attachment deleted successfully from server:', attachmentId);
        } catch (deleteError) {
          console.error('Error deleting attachment from server:', deleteError);
          // Continue with UI update even if server deletion fails
        }
      }
    } catch (error) {
      console.error('Error handling attachment deletion:', error);
    }
  };

  // Updated handleSubmit function to not automatically exit edit mode
  const handleSubmit = async (e?: React.FormEvent): Promise<boolean> => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      // Find the first error and navigate to its tab
      const firstErrorKey = Object.keys(errors)[0];
      
      if (firstErrorKey) {
        // Map the error field to its tab
        let tabToNavigate = 'appointment';
        
        if (['customername', 'customerMobille', 'address', 'perioxi', 'kya'].includes(firstErrorKey)) {
          tabToNavigate = 'appointment';
        } else if (['adminname', 'adminMobile'].includes(firstErrorKey)) {
          tabToNavigate = 'appointment';
        } else if (['floors', 'customerfloor', 'dog', 'apartCode', 'smartreadiness'].includes(firstErrorKey)) {
          tabToNavigate = 'building';
        } else if (['selectorofos', 'selectdiamerismata', 'selctorofos1'].includes(firstErrorKey)) {
          tabToNavigate = 'floors';
        } else if (['earthWork', 'mhkosXwmatourgikou', 'typePlakas', 'megethosPlakas'].includes(firstErrorKey)) {
          tabToNavigate = 'soil';
        } else if (['needBCP', 'nearBCP', 'eidosBcp', 'kagkela', 'kanali', 'enaeria', 'dyskoliakat'].includes(firstErrorKey)) {
          tabToNavigate = 'construction';
        } else if (['status', 'anamoniypografhs', 'anamoniwfm', 'aitiaApor', 'mioloklirisocuz', 'diaxeirisi', 'xrewsh', 'posoxrewshs'].includes(firstErrorKey)) {
          tabToNavigate = 'closing';
        }
        
        setActiveTab(tabToNavigate);
        return false;
      }
    }
  
    setIsSaving(true);
    
    try {
      // Create a copy of formData for modifications
      let updatedFormData: TestAppointment = { ...formData };
      
      // Handle file uploads if there are any
      if (appointment?.id && formData.attachmentUploads && formData.attachmentUploads.length > 0) {
        // Create an array to store successful upload results
        const successfulUploads: Array<{ id: string; name: string; type: string }> = [];
        
        // Process each file one by one to avoid type issues
        for (const file of formData.attachmentUploads) {
          try {
            // Check if we're working with actual File objects
            if (file instanceof File) {
              // Create FormData for the upload
              const formDataUpload = new FormData();
              formDataUpload.append('file', file);
              formDataUpload.append('parentType', 'Test');
              formDataUpload.append('parentId', appointment.id);
              
              // Use fetch directly for attachment upload
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.150:8080/api/v1'}/Attachment`, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${localStorage.getItem('auth_token') || ''}`,
                },
                body: formDataUpload,
              });
              
              if (!response.ok) {
                throw new Error(`Error uploading attachment: ${response.statusText}`);
              }
              
              const result = await response.json();
              
              // Add to successful uploads
              successfulUploads.push({
                id: result.id,
                name: file.name,
                type: file.type
              });
            }
          } catch (uploadError) {
            console.error('Error uploading attachment:', uploadError);
          }
        }
        
        // Update attachment information in formData
        if (successfulUploads.length > 0) {
          // Create a new array with existing IDs and new IDs
          const newAttachmentIds = [
            ...(updatedFormData.attachmentIds || []),
            ...successfulUploads.map(upload => upload.id)
          ];
          
          // Create a new attachmentNames object
          const newAttachmentNames = { ...(updatedFormData.attachmentNames || {}) };
          // Create a new attachmentTypes object
          const newAttachmentTypes = { ...(updatedFormData.attachmentTypes || {}) };
          
          // Add new uploads to the objects
          successfulUploads.forEach(upload => {
            newAttachmentNames[upload.id] = upload.name;
            newAttachmentTypes[upload.id] = upload.type;
          });
          
          // Update the form data
          updatedFormData = {
            ...updatedFormData,
            attachmentIds: newAttachmentIds,
            attachmentNames: newAttachmentNames,
            attachmentTypes: newAttachmentTypes,
            // Clear the uploads array since they've been processed
            attachmentUploads: []
          };
        }
      }
      
      // Direct API call to EspoCRM
      if (appointment?.id) {
        // Prepare data for EspoCRM
        const espoData = { ...updatedFormData };
        
        // Format dates correctly for the API
        if (espoData.dateStart) {
          espoData.dateStart = new Date(espoData.dateStart).toISOString();
        }
        if (espoData.dateEnd) {
          espoData.dateEnd = new Date(espoData.dateEnd).toISOString();
        }
        
        // Remove properties that EspoCRM might not expect
        delete espoData.attachmentUploads;
        
        console.log('Sending to EspoCRM:', espoData);
        
        // Direct API call to update the record
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.150:8080/api/v1'}/Test/${appointment.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${localStorage.getItem('auth_token') || ''}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(espoData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('EspoCRM API Error:', errorText);
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('EspoCRM API Success:', result);
      }
      
      // Still call the parent's onSave for UI updates and consistency
      await onSave(updatedFormData);
      
      // Show success message but don't automatically exit edit mode
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 2000);
      
      setHasChanges(false);
      return true; // Return success
    } catch (error) {
      console.error('Error saving appointment:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

// Add a new function to reload the appointment data
const reloadAppointmentData = async () => {
  if (!appointment?.id) return;
  
  try {
    console.log('Reloading appointment data with ID:', appointment.id);
    
    // Fetch appointment data using appointmentService
    const appointmentData = await appointmentService.getAppointmentById(appointment.id);
    
    // Fetch attachment data using direct fetch if needed
    try {
      // Create search params for the attachment query
      const params = {
        where: [
          {
            type: 'equals',
            attribute: 'parentId',
            value: appointment.id
          },
          {
            type: 'equals',
            attribute: 'parentType',
            value: 'Test'
          }
        ],
        select: ['id', 'name', 'type'] 
      };
      
      const searchParams = encodeURIComponent(JSON.stringify(params));
      
      // Make the fetch request for attachments
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.150:8080/api/v1'}/Attachment?searchParams=${searchParams}`, {
        headers: {
          'Authorization': `Basic ${localStorage.getItem('auth_token') || ''}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching attachments: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const attachmentsList = responseData.list || [];
      
      if (attachmentsList.length > 0) {
        // Update the attachment data in the appointment
        appointmentData.attachmentIds = attachmentsList.map((att: any) => att.id);
        
        // Create attachmentNames object
        appointmentData.attachmentNames = {};
        attachmentsList.forEach((att: any) => {
          if (appointmentData.attachmentNames) {
            appointmentData.attachmentNames[att.id] = att.name || `Attachment ${att.id}`;
          }
        });
        
        // Create attachmentTypes object
        appointmentData.attachmentTypes = {};
        attachmentsList.forEach((att: any) => {
          if (appointmentData.attachmentTypes) {
            appointmentData.attachmentTypes[att.id] = att.type || '';
          }
        });
      }
    } catch (attachmentError) {
      console.error('Error fetching attachments:', attachmentError);
      
      // Initialize empty attachment data if fetch fails
      appointmentData.attachmentIds = [];
      appointmentData.attachmentNames = {};
      appointmentData.attachmentTypes = {};
    }
    
    console.log('Reloaded appointment data:', appointmentData);
    setFormData(appointmentData);
    
    // Store original data for detecting changes
    setOriginalData({...appointmentData});
    
    return true;
  } catch (error) {
    console.error('Error reloading appointment:', error);
    return false;
  }
};

// Modified handleConfirmChanges to reload data after save
const handleConfirmChanges = async () => {
  try {
    const success = await handleSubmit();
    if (success) {
      // Exit edit mode
      setIsEditMode(false);
      // Reload data to refresh the modal content
      await reloadAppointmentData();
      // Refresh parent component (if there's a way to trigger this)
      if (window.opener && typeof window.opener.refreshList === 'function') {
        window.opener.refreshList();
      }
    }
    setShowConfirmDialog(false);
  } catch (error) {
    console.error('Error saving changes:', error);
    setShowConfirmDialog(false);
  }
};

  // Status color styles
  const getStatusStyle = (status: string): string => {
    const statusOption = STATUS_OPTIONS.find(opt => opt.value === status);
    return statusOption?.style || 'bg-gray-100 text-gray-700';
  };

  // Format the date to a readable string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('el-GR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
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
    required = false,
    readOnly = false
  }: {
    label: string,
    name: string,
    value: any,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void,
    type?: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox' | 'wysiwyg',
    options?: Array<{value: string, label: string, style?: string}>,
    placeholder?: string,
    error?: string,
    disabled?: boolean,
    required?: boolean,
    readOnly?: boolean
  }) => {
    // Determine if the field should be shown as read-only
    const isFieldReadOnlyView = !isEditMode || readOnly || isFieldReadOnly(name);
    
    const labelClassName = `${inter.className} block text-sm font-medium ${error ? 'text-red-700' : 'text-gray-700'} mb-1`;
    const inputClassName = `${inter.className} w-full rounded-md ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} shadow-sm transition-colors duration-200`;
    
    const getValueDisplay = () => {
      if (type === 'select') {
        const option = options.find(opt => opt.value === value);
        return option ? option.label : value;
      } else if (type === 'checkbox') {
        return value ? 'Ναι' : 'Όχι';
      } else if (type === 'wysiwyg') {
        // For wysiwyg, display as HTML content
        return <div className={inter.className} dangerouslySetInnerHTML={{ __html: value || '' }} />;
      }
      return value;
    };
    
    return (
    <div className="mb-0"> {/* Reduced bottom margin from mb-3 to mb-0 */}
        <label htmlFor={name} className={labelClassName}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {isFieldReadOnlyView ? (
          type === 'select' && value ? (
            <div className={`${inter.className} block text-sm rounded-md px-2 py-1 ${
              options.find(opt => opt.value === value)?.style || 'bg-gray-50 text-gray-900'
            }`}>
              {getValueDisplay() || '-'}
            </div>
          ) : (
            <div className={`${inter.className} block text-sm text-gray-900 py-1 px-1 ${
              type === 'wysiwyg' ? 'bg-aspro border rounded-md p-2' : ''
            }`}>
              {getValueDisplay() || '-'}
            </div>
          )
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
                min={0}
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
                type="datetime-local"
                id={name}
                name={name}
                value={value ? new Date(value).toISOString().slice(0, 16) : ''}
                onChange={onChange}
                className={inputClassName}
                disabled={disabled}
              />
            )}
            
            {type === 'checkbox' && (
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  id={name}
                  name={name}
                  checked={!!value}
                  onChange={onChange}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  disabled={disabled}
                />
                <label htmlFor={name} className={`${inter.className} ml-2 block text-sm text-gray-700`}>
                  {placeholder || label}
                </label>
              </div>
            )}
            
            {type === 'wysiwyg' && (
              <div className="border border-gray-300 rounded-md overflow-hidden">
                <textarea
                  id={name}
                  name={name}
                  value={value || ''}
                  onChange={onChange}
                  className={`${inputClassName} min-h-[150px]`}
                  placeholder={placeholder}
                  disabled={disabled}
                />
              </div>
            )}
          </>
        )}
        
        {error && (
          <p className={`${inter.className} mt-1 text-xs text-red-600`}>{error}</p>
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
      <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
          <h3 className={`${inter.className} text-base font-semibold text-gray-800 flex items-center gap-2`}>
            <Icon className="h-4 w-4 text-blue-600" />
            {title}
          </h3>
        </div>
        <div className="p-3">
          {children}
        </div>
      </div>
    );
  };

  const renderAppointmentTab = () => (
    <div className="space-y-4">
      {/* Appointment Details Section */}
      <Card title="Βασικά Στοιχεία Αυτοψίας" icon={Clipboard}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="SR"
              name="sr"
              value={formData.srText}
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
          
          {/* Date and Time pickers with separate fields */}
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
              Ημερομηνία & Ώρα Έναρξης{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="date"
                  id="dateStart-date"
                  name="dateStart"
                  value={formData.dateStart ? new Date(formData.dateStart).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const currentTime = formData.dateStart 
                      ? new Date(formData.dateStart).toISOString().split('T')[1].substring(0, 5) 
                      : '00:00';
                    
                    const newDateTime = `${e.target.value}T${currentTime}:00.000Z`;
                    handleInputChange({
                      target: {
                        name: 'dateStart',
                        value: newDateTime
                      }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
              <div className="w-1/3">
                <input
                  type="time"
                  id="dateStart-time"
                  name="dateStart-time"
                  value={formData.dateStart ? new Date(formData.dateStart).toISOString().split('T')[1].substring(0, 5) : ''}
                  onChange={(e) => {
                    const currentDate = formData.dateStart 
                      ? new Date(formData.dateStart).toISOString().split('T')[0] 
                      : new Date().toISOString().split('T')[0];
                    
                    const newDateTime = `${currentDate}T${e.target.value}:00.000Z`;
                    handleInputChange({
                      target: {
                        name: 'dateStart',
                        value: newDateTime
                      }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
              Ημερομηνία & Ώρα Λήξης{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <input
                  type="date"
                  id="dateEnd-date"
                  name="dateEnd"
                  value={formData.dateEnd ? new Date(formData.dateEnd).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const currentTime = formData.dateEnd 
                      ? new Date(formData.dateEnd).toISOString().split('T')[1].substring(0, 5) 
                      : '00:00';
                    
                    const newDateTime = `${e.target.value}T${currentTime}:00.000Z`;
                    handleInputChange({
                      target: {
                        name: 'dateEnd',
                        value: newDateTime
                      }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
              <div className="w-1/3">
                <input
                  type="time"
                  id="dateEnd-time"
                  name="dateEnd-time"
                  value={formData.dateEnd ? new Date(formData.dateEnd).toISOString().split('T')[1].substring(0, 5) : ''}
                  onChange={(e) => {
                    const currentDate = formData.dateEnd 
                      ? new Date(formData.dateEnd).toISOString().split('T')[0] 
                      : new Date().toISOString().split('T')[0];
                    
                    const newDateTime = `${currentDate}T${e.target.value}:00.000Z`;
                    handleInputChange({
                      target: {
                        name: 'dateEnd',
                        value: newDateTime
                      }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
  
      {/* Customer Details Section */}
      <Card title="Στοιχεία Πελάτη" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Όνομα Πελάτη"
              name="customername"
              value="John Doe"
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κινητό Πελάτη"
              name="customermobile"
              value="69xxxxxxxx"
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
  
          <div className="border border-blue-100 rounded-md p-2 bg-aspro md:col-span-2">
            <FormField
              label="Διεύθυνση"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Περιοχή"
              name="perioxi"
              value={formData.perioxi}
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Όροφος Υπηρεσίας"
              name="servicefloor"
              value={formData.servicefloor}
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κωδικός Διαμερίσματος"
              name="apartCode"
              value={formData.apartCode}
              onChange={handleInputChange}
              required={isFieldRequired('apartCode', formData)}
              error={errors.apartCode}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="ΝΕΑ ΚΥΑ"
              name="kya"
              value={formData.kya}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
              required={isFieldRequired('kya', formData)}
              error={errors.kya}
            />
          </div>
        </div>
      </Card>
  
      {/* Administrator Details Section */}
      <Card title="Στοιχεία Διαχειριστή" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Όνομα Διαχειριστή"
              name="adminname"
              value={formData.adminname}
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κινητό Διαχειριστή"
              name="adminMobile"
              value={formData.adminMobile}
              onChange={handleInputChange}
              readOnly={true}
            />
          </div>
        </div>
      </Card>
    </div>
  );

  // Modified Building Tab to include Smart Readiness section
  const renderBuildingTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Στοιχεία Κτιρίου" icon={Building2}>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Κωδικός Κτιρίου"
            name="bid"
            value={formData.bid}
            onChange={handleInputChange}
            readOnly={true}
          />
          <FormField
            label="Επίπεδα"
            name="floors"
            value={formData.floors}
            onChange={handleInputChange}
            type="select"
            options={[
              { value: '', label: 'Επιλέξτε...' },
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
              { value: '6', label: '6' },
              { value: '7', label: '7' },
              { value: '8', label: '8' },
              { value: '9', label: '9' },
              { value: '10', label: '10' }
            ]}
            required={isFieldRequired('floors', formData)}
            error={errors.floors}
          />
          <FormField
            label="Όροφος Πελάτη"
            name="customerfloor"
            value={formData.customerfloor}
            onChange={handleInputChange}
            type="select"
            options={CUSTOMER_FLOOR_OPTIONS}
            required={isFieldRequired('customerfloor', formData)}
            error={errors.customerfloor}
          />
          {isFieldVisible('dog', formData) && (
            <FormField
              label="Υπάρχει Σκύλος"
              name="dog"
              value={formData.dog}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
              required={isFieldRequired('dog', formData)}
              error={errors.dog}
            />
          )}
        </div>
      </Card>
      
      {/* Added Smart Readiness Card */}
      <Card title="Smart Readiness" icon={Settings}>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            label="Smart Readiness"
            name="smartreadiness"
            value={formData.smartreadiness}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
          />
          
          {formData.smartreadiness === 'ΝΑΙ' && (
            <div className="border border-blue-100 rounded-md p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className={`${inter.className} text-sm font-medium text-gray-600`}>
                  Smart Readiness Enabled
                </span>
                <span className={`${inter.className} px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium`}>
                  Enabled
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

const renderFloorsTab = () => {
  const floorCount = parseInt(formData.floors || '') || 0;
  if (floorCount <= 0) {
    return (
      <div className={`${inter.className} bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-700 flex items-center`}>
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Παρακαλώ ορίστε πρώτα τον αριθμό των ορόφων στην καρτέλα Στοιχεία Κτιρίου.</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 bg-aspro rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className={`${inter.className} text-lg font-semibold text-gray-800 flex items-center gap-2`}>
              <Building2 className="h-5 w-5 text-blue-600" />
              Σύνολο Ορόφων
            </h3>
            <span className={`${inter.className} inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800`}>
              {floorCount} {floorCount === 1 ? 'όροφος' : 'όροφοι'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: floorCount }).map((_, index) => (
          <div
            key={index}
            className="bg-aspro rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className={`${inter.className} text-lg font-medium text-gray-900 mb-4 flex items-center gap-2 p-2 bg-gray-50 rounded-lg`}>
              <Building2 className="h-5 w-5 text-blue-600" />
              Όροφος {index + 1}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
                  Επίπεδο
                </label>
                {isEditMode ? (
                  <select
                    value={(formData.selectorofos && formData.selectorofos[index]) || ''}
                    onChange={(e) => handleFloorFieldChange(index, 'selectorofos', e.target.value)}
                    className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  >
                    <option value="">Επιλέξτε επίπεδο</option>
                    {CUSTOMER_FLOOR_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`${inter.className} block text-sm text-gray-900 py-2 px-1 bg-gray-50 rounded border border-gray-200`}>
                    {formData.selectorofos && formData.selectorofos[index] ? 
                      CUSTOMER_FLOOR_OPTIONS.find(option => option.value === (formData.selectorofos && formData.selectorofos[index]))?.label || 
                      (formData.selectorofos && formData.selectorofos[index]) : '-'}
                  </span>
                )}
              </div>

              <div>
                <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
                  Διαμερίσματα
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={(formData.selectdiamerismata && formData.selectdiamerismata[index]) ?? ''}
                    onChange={(e) => handleFloorFieldChange(index, 'selectdiamerismata', e.target.value)}
                    min={0}
                    max={20}
                    className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  />
                ) : (
                  <span className={`${inter.className} block text-sm text-gray-900 py-2 px-1 bg-gray-50 rounded border border-gray-200`}>
                    {(formData.selectdiamerismata && formData.selectdiamerismata[index]) ?? '-'}
                  </span>
                )}
              </div>

              <div>
                <label className={`${inter.className} block text-sm font-medium text-gray-700 mb-1`}>
                  Floorbox
                </label>
                {isEditMode ? (
                  <input
                    type="number"
                    value={(formData.floorbox && formData.floorbox[index]) ?? ''}
                    onChange={(e) => handleFloorFieldChange(index, 'floorbox', parseInt(e.target.value))}
                    min={1}
                    max={5}
                    className={`${inter.className} w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500`}
                  />
                ) : (
                  <span className={`${inter.className} block text-sm text-gray-900 py-2 px-1 bg-gray-50 rounded border border-gray-200`}>
                    {(formData.floorbox && formData.floorbox[index]) ?? '-'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderSoilTab = () => (
  <div className="space-y-6">
    <Card title="Χωματουργικό" icon={PencilRuler}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-blue-100 rounded-md p-2 bg-aspro">
          <FormField
            label="Χρειάζεται BCP"
            name="needBCP"
            value={formData.needBCP}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
            required={isFieldRequired('needBCP', formData)}
            error={errors.needBCP}
          />
        </div>
        
        {isFieldVisible('nearBCP', formData) && (
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κοντινό BCP"
              name="nearBCP"
              value={formData.nearBCP}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
              required={isFieldRequired('nearBCP', formData)}
              error={errors.nearBCP}
            />
          </div>
        )}
        
        {isFieldVisible('eidosBcp', formData) && (
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Είδος BCP"
              name="eidosBcp"
              value={formData.eidosBcp}
              onChange={handleInputChange}
              type="select"
              options={BCP_TYPES}
              required={isFieldRequired('eidosBcp', formData)}
              error={errors.eidosBcp}
            />
          </div>
        )}
        
        <div className="border border-blue-100 rounded-md p-2 bg-aspro">
          <FormField
            label="Χρειάζεται Φύσημα"
            name="blowJob"
            value={formData.blowJob}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
            required={isFieldRequired('blowJob', formData)}
            error={errors.blowJob}
          />
        </div>
        
        <div className="border border-blue-100 rounded-md p-2 bg-aspro">
          <FormField
            label="Χρειάζεται Χωματουργικό"
            name="earthWork"
            value={formData.earthWork}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
          />
        </div>
        
        {isFieldVisible('mhkosXwmatourgikou', formData) && (
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Μήκος Χωματουργικού (μέτρα)"
              name="mhkosXwmatourgikou"
              value={formData.mhkosXwmatourgikou}
              onChange={handleInputChange}
              type="number"
              required={isFieldRequired('mhkosXwmatourgikou', formData)}
              error={errors.mhkosXwmatourgikou}
            />
          </div>
        )}
        
        {isFieldVisible('typePlakas', formData) && (
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Τύπος Πλάκας"
              name="typePlakas"
              value={formData.typePlakas}
              onChange={handleInputChange}
              type="select"
              options={PLAKA_TYPES}
            />
          </div>
        )}
        
        {isFieldVisible('megethosPlakas', formData) && (
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Μέγεθος Πλάκας"
              name="megethosPlakas"
              value={formData.megethosPlakas}
              onChange={handleInputChange}
              type="select"
              options={PLAKA_SIZES}
              required={isFieldRequired('megethosPlakas', formData)}
              error={errors.megethosPlakas}
            />
          </div>
        )}
        
        {isFieldVisible('alloPlaka', formData) && (
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Άλλο Μέγεθος Πλάκας"
              name="alloPlaka"
              value={formData.alloPlaka}
              onChange={handleInputChange}
              required={isFieldRequired('alloPlaka', formData)}
              error={errors.alloPlaka}
            />
          </div>
        )}
        
        <div className="border border-blue-100 rounded-md p-2 bg-aspro">
          <FormField
            label="Χωματουργικό σε Κήπο"
            name="earthworkGarden"
            value={formData.earthworkGarden}
            onChange={handleInputChange}
            type="select"
            options={YES_NO_OPTIONS}
            required={isFieldRequired('earthworkGarden', formData)}
            error={errors.earthworkGarden}
          />
        </div>
      </div>
    </Card>
  </div>
);

  const renderConstructionTab = () => (
    <div className="space-y-6">
      <Card title="Κατασκευαστικά" icon={Construction}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κάγκελα"
              name="kagkela"
              value={formData.kagkela}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κανάλι"
              name="kanali"
              value={formData.kanali}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Εναέρια"
              name="enaeria"
              value={formData.enaeria}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Δυσκολία Κατασκευής"
              name="dyskoliakat"
              value={formData.dyskoliakat}
              onChange={handleInputChange}
              type="select"
              options={SOIL_DIFFICULTY_OPTIONS}
            />
          </div>
        </div>
      </Card>
      
      {isFieldVisible('relatedChoma', formData) && (
        <Card title="Συσχετιζόμενες Εργασίες" icon={Construction}>
          <div className="grid grid-cols-1 gap-4">
            <div className="border border-blue-100 rounded-md p-2 bg-aspro">
              <FormField
                label="Συσχετιζόμενο Χώμα"
                name="relatedChoma"
                value={formData.relatedChoma}
                onChange={handleInputChange}
                type="wysiwyg"
              />
            </div>
            
            <div className="border border-blue-100 rounded-md p-2 bg-aspro">
              <FormField
                label="Συσχετιζόμενη Κατασκευή"
                name="relatedKataskeyi"
                value={formData.relatedKataskeyi}
                onChange={handleInputChange}
                type="wysiwyg"
              />
            </div>
            
            <div className="border border-blue-100 rounded-md p-2 bg-aspro">
              <FormField
                label="Συσχετιζόμενη Συγκόλληση"
                name="relatedSplicing"
                value={formData.relatedSplicing}
                onChange={handleInputChange}
                type="wysiwyg"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
  

  // Modified to handle returning to previous tab when closing image preview
  const renderAttachmentsTab = () => {
    // Transform attachmentIds and attachmentNames into AttachmentFile array
    const attachments = (formData.attachmentIds || []).map(id => ({
      id,
      name: (formData.attachmentNames || {})[id] || `File ${id}`,
      type: (formData.attachmentTypes || {})[id] || '',
    }));

    return (
      <Card title="Επισυναπτόμενα Αρχεία" icon={FileText}>
        <div className="mt-1 mb-4">
          {isEditMode && (
            <div className="flex items-center justify-center w-full mb-4">
              <label 
                htmlFor="fileUpload" 
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 hover:border-blue-500 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-3 text-gray-400" />
                  <p className={`${inter.className} mb-2 text-sm text-gray-500`}>
                    <span className="font-medium">Κάντε κλικ για να ανεβάσετε αρχεία</span>
                  </p>
                  <p className={`${inter.className} text-xs text-gray-500`}>Αποδεκτά αρχεία: PNG, JPG, PDF, DOCX</p>
                </div>
                <input 
                  id="fileUpload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf,.docx"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
          
          {/* Save the current tab before viewing attachments */}
          <AttachmentHandlers
            attachments={attachments}
            onDelete={handleDeleteAttachment}
            onFileUpload={handleFileChange}
            isEditMode={isEditMode}
          />
        </div>
      </Card>
    );
  };

  const renderClosingTab = () => (
    <div className="space-y-6">
      <Card title="Κατάσταση" icon={ClipboardCheck}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Κατάσταση"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              type="select"
              options={STATUS_OPTIONS}
              required={true}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Αναμονή Υπογραφής"
              name="anamoniypografhs"
              value={formData.anamoniypografhs}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
              required={isFieldRequired('anamoniypografhs', formData)}
              error={errors.anamoniypografhs}
            />
          </div>
          
          {isFieldVisible('anamoniwfm', formData) && (
            <div className="border border-blue-100 rounded-md p-2 bg-aspro">
              <FormField
                label="Αναμονή WFM"
                name="anamoniwfm"
                value={formData.anamoniwfm}
                onChange={handleInputChange}
                type="select"
                options={YES_NO_OPTIONS}
                required={isFieldRequired('anamoniwfm', formData)}
                error={errors.anamoniwfm}
              />
            </div>
          )}
        </div>
        
        {isFieldVisible('aitiaApor', formData) && (
          <div className="mt-4 border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Αιτία Απόρριψης"
              name="aitiaApor"
              value={formData.aitiaApor}
              onChange={handleInputChange}
              type="select"
              options={[
                { value: '', label: 'Επιλέξτε...' },
                { value: 'ΑΠΟΥΣΙΑ ΠΕΛΑΤΗ', label: 'ΑΠΟΥΣΙΑ ΠΕΛΑΤΗ' }
              ]}
            />
          </div>
        )}
        
        {isFieldVisible('mioloklirisocuz', formData) && (
          <div className="mt-4 border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Αιτία Μη Ολοκλήρωσης"
              name="mioloklirisocuz"
              value={formData.mioloklirisocuz}
              onChange={handleInputChange}
              type="select"
              options={COMPLETION_REASONS}
            />
          </div>
        )}
      </Card>
      
      <Card title="Διαχείριση & Χρέωση" icon={Settings}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Διαχείριση"
              name="diaxeirisi"
              value={formData.diaxeirisi}
              onChange={handleInputChange}
              type="select"
              options={DIAXEIRISI_OPTIONS}
            />
          </div>
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Χρέωση"
              name="xrewsh"
              value={formData.xrewsh}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
            />
          </div>
          
          {isFieldVisible('posoxrewshs', formData) && (
            <div className="border border-blue-100 rounded-md p-2 bg-aspro">
              <FormField
                label="Ποσό Χρέωσης"
                name="posoxrewshs"
                value={formData.posoxrewshs}
                onChange={handleInputChange}
                required={isFieldRequired('posoxrewshs', formData)}
                error={errors.posoxrewshs}
              />
            </div>
          )}
          
          <div className="border border-blue-100 rounded-md p-2 bg-aspro">
            <FormField
              label="Εξωσυστημική"
              name="ekswsysthmikh"
              value={formData.ekswsysthmikh}
              onChange={handleInputChange}
              type="select"
              options={YES_NO_OPTIONS}
            />
          </div>
        </div>
      </Card>
      
      <Card title="Σχόλια" icon={FileText}>
        <div className="border border-blue-100 rounded-md p-2 bg-aspro">
          <FormField
            label="Σχόλια και Παρατηρήσεις"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            type="textarea"
            placeholder="Προσθέστε σχόλια ή παρατηρήσεις..."
          />
        </div>
      </Card>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className={`${inter.className} fixed inset-0 z-50 overflow-hidden`}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          {/* Modal Container */}
          <div className="relative transform overflow-hidden rounded-lg bg-aspro text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
            {/* Content */}
            <div className="flex flex-col h-screen max-h-[90vh]">
              {/* Header */}
              <div className="sticky top-0 z-20 bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4 text-white shadow">
                <div className="flex items-center justify-between">
                  <h2 className={`${inter.className} text-xl font-semibold flex items-center gap-2`}>
                    <Calendar className="h-5 w-5" />
                    Διαχείριση Ραντεβού Αυτοψίας
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className={`${inter.className} flex items-center text-white text-sm`}>
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{formData.address || 'Χωρίς διεύθυνση'}</span>
                    </div>
                    <button
                      onClick={onClose}
                      className="ml-4 rounded-full p-1 hover:bg-blue-700 focus:outline-none transition-colors duration-150"
                      aria-label="Κλείσιμο"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="sticky top-[68px] z-20 bg-aspro border-b border-gray-200 px-6 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className={`${inter.className} block text-xs font-medium text-gray-500 mb-1`}>
                        Κατάσταση
                      </label>
                      <span className={`
                        ${inter.className} 
                        inline-block text-sm py-1 px-3 rounded-full
                        ${getStatusStyle(formData.status)}
                      `}>
                        {STATUS_OPTIONS.find(option => option.value === formData.status)?.label || formData.status}
                      </span>
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
                  </div>
                  
                  <div>
                    {!isEditMode ? (
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className={`${inter.className} inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md 
                                shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                                focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                      >
                        <Edit className="h-4 w-4 mr-1" /> 
                        Επεξεργασία
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className={`${inter.className} inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md 
                                 text-gray-700 bg-aspro hover:bg-gray-50 focus:outline-none focus:ring-2 
                                focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Ακύρωση
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmDialog(true)}
                          className={`${inter.className} inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md 
                                shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                                focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
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

              {/* Main Content - Added modal-content-scroll class */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="px-6 py-4 bg-gray-50 min-h-[400px]">
                  {activeTab === 'appointment' && renderAppointmentTab()}
                  {activeTab === 'building' && renderBuildingTab()}
                  {activeTab === 'floors' && renderFloorsTab()}
                  {activeTab === 'soil' && renderSoilTab()}
                  {activeTab === 'construction' && renderConstructionTab()}
                  {activeTab === 'attachments' && renderAttachmentsTab()}
                  {activeTab === 'closing' && renderClosingTab()}
                </div>
              </form>

              {/* Fixed Footer */}
              <div className="bg-aspro px-6 py-3 border-t border-gray-200 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className={`${inter.className} flex items-center text-sm text-gray-500`}>
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      Τελευταία τροποποίηση: {formData.modifiedAt ? formatDate(formData.modifiedAt) : formatDate(new Date().toISOString())}
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
                        focus:ring-offset-2 focus:ring-blue-500 transition-colors
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
                          px-4 py-2 text-sm font-medium text-white bg-blue-600 border 
                          border-transparent rounded-md shadow-sm hover:bg-blue-700 
                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                          transition-colors
                        `}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <span className={`${inter.className} flex items-center`}>
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
        message="Είστε βέβαιοι ότι θέλετε να αποθηκεύσετε τις αλλαγές;"
      />
    </div>
  );
};

export default ManageAppointmentModal;
                        