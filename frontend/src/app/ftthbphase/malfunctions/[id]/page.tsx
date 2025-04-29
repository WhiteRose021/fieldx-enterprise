"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Building2,
  Phone,
  MapPin,
  Calendar,
  Users,
  FileText,
  Pencil,
  Upload,
  Clock,
  Wrench,
  Shovel,
  FileArchiveIcon,
  Image,
  Download,
  Trash,
  ExternalLink,
  CheckCircle,
  ClipboardList,
  Tag,
  Layers,
  Mail,
  Save,
  X,
} from "lucide-react";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";
import { useMalfunction, useUpdateMalfunction, useUploadMalfunctionAttachment, useDeleteMalfunctionAttachment } from "@/lib/api/malfunctions";

// Import with dynamic loading for client-side only components
const GoogleMap = dynamic(() => import("@/components/Maps/GoogleMap"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 flex items-center justify-center">
      <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
      <span>Loading map...</span>
    </div>
  ),
});

// Field categories for organized display 
const fieldSections = [
  {
    id: "section1",
    label: "ΣΤΟΙΧΕΙΑ ΒΛΑΒΗΣ",
    fields: [
      "status", "blowingDone", "datecreated", "name", "idvlavis", "address", 
      "perioxi", "tk", "textdatestart"
    ]
  },
  {
    id: "section2",
    label: "ΠΕΛΑΤΗΣ",
    fields: ["customername", "customermobile", "addressformatted"],
    condition: (data: any) => data.customername !== null && data.customername !== undefined && data.customername !== ""
  },
  {
    id: "section3",
    label: "ΔΕΛΤΙΟ ΠΡΟΜΕΛΕΤΗΣ",
    fields: ["pdfattachment", "description"]
  },
  {
    id: "section4",
    label: "ΣΤΟΙΧΕΙΑ ΕΡΓΑΣΙΑΣ",
    fields: ["type", "jobdescription", "photos", "soilphotos"]
  },
  {
    id: "section5",
    label: "ΥΠΟΛΟΙΠΕΣ ΠΛΗΡΟΦΟΡΙΕΣ",
    fields: [
      "metravlavhcab", "metravlavhbcpbep", "metravlavhbepfb", 
      "splittertype", "splitterbcp", "moufarisma"
    ]
  }
];

// Field definitions with types and labels
const fieldDefinitions: Record<string, { label: string, type: string }> = {
  name: { label: "Αριθμός", type: "varchar" },
  description: { label: "Περιγραφή", type: "text" },
  createdAt: { label: "Ημερομηνία Δημιουργίας", type: "datetime" },
  modifiedAt: { label: "Ημερομηνία Τροποποίησης", type: "datetime" },
  deleted: { label: "Διαγραμμένο", type: "bool" },
  type: { label: "Τύπος", type: "checklist" },
  status: { label: "Κατάσταση", type: "enum" },
  idvlavis: { label: "ID Βλάβης", type: "varchar" },
  perioxi: { label: "Περιοχή", type: "varchar" },
  tk: { label: "Τ.Κ.", type: "varchar" },
  ak: { label: "ΑΚ", type: "varchar" },
  lat: { label: "Γεωγρ. Πλάτος", type: "varchar" },
  long: { label: "Γεωγρ. Μήκος", type: "varchar" },
  ttlp: { label: "TTLP", type: "varchar" },
  address: { label: "Διεύθυνση", type: "text" },
  datecreated: { label: "Ημερομηνία Δημιουργίας", type: "datetime" },
  customername: { label: "Όνομα Πελάτη", type: "varchar" },
  customermobile: { label: "Τηλέφωνο Πελάτη", type: "varchar" },
  addressformatted: { label: "Διεύθυνση (Μορφοποιημένη)", type: "varchar" },
  cab: { label: "CAB", type: "varchar" },
  blowingDone: { label: "Εμφύσηση", type: "enum" },
  textdatestart: { label: "Ημερομηνία Έναρξης", type: "varchar" },
  metravlavhcab: { label: "Μέτρα Βλάβης CAB", type: "int" },
  metravlavhbcpbep: { label: "Μέτρα Βλάβης BCP/BEP", type: "int" },
  metravlavhbepfb: { label: "Μέτρα Βλάβης BEP/FB", type: "int" },
  splittertype: { label: "Τύπος Splitter", type: "enum" },
  splitterbcp: { label: "Splitter BCP", type: "enum" },
  moufarisma: { label: "Μουφάρισμα", type: "enum" },
  jobdescription: { label: "Περιγραφή Εργασίας", type: "enum" },
  
  // Link fields
  createdById: { label: "ID Δημιουργού", type: "varchar" },
  createdByName: { label: "Δημιουργός", type: "varchar" },
  modifiedById: { label: "ID Τροποποιητή", type: "varchar" },
  modifiedByName: { label: "Τροποποιητής", type: "varchar" },
  assignedUserId: { label: "ID Υπεύθυνου", type: "varchar" },
  assignedUserName: { label: "Υπεύθυνος", type: "varchar" },
  
  // Photo fields
  photos: { label: "Φωτογραφίες", type: "attachmentMultiple" },
  soilphotos: { label: "Φωτογραφίες Χώματος", type: "attachmentMultiple" },
  pdfattachment: { label: "PDF Έγγραφα", type: "attachmentMultiple" },
};

// Interface for attachment files
interface AttachmentFile {
  id: string;
  name: string;
  type: string;
  url?: string;
  fieldType: string; // 'photos', 'soilphotos', or 'pdfattachment'
}

// Type for the different tabs
type TabType = "details" | "photos" | "pdfs" | "teams";

// Main component
export default function MalfunctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  
  // React Query hooks for data fetching and mutations
  const { 
    data: malfunction, 
    isLoading, 
    error,
    refetch 
  } = useMalfunction(typeof id === "string" ? id : "");
  
  const updateMalfunctionMutation = useUpdateMalfunction();
  const uploadAttachmentMutation = useUploadMalfunctionAttachment();
  const deleteAttachmentMutation = useDeleteMalfunctionAttachment();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [isEditMode, setIsEditMode] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string>("");
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  // Format date helper function
  const formatDate = useCallback((dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("el-GR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (error) {
      console.error("Invalid date format:", dateString);
      return "Invalid Date";
    }
  }, []);

  // Initialize form data when malfunction data is loaded
  useEffect(() => {
    if (malfunction) {
      setFormData(malfunction);
      processAttachments(malfunction);
    }
  }, [malfunction]);

  // Process attachments from malfunction data
  const processAttachments = useCallback((data: any) => {
    try {
      setLoadingAttachments(true);
      
      const allAttachments: AttachmentFile[] = [];
      
      // Process photos
      if (data.photosIds && data.photosIds.length > 0) {
        data.photosIds.forEach((photoId: string) => {
          allAttachments.push({
            id: photoId,
            name: data.photosNames?.[photoId] || `Photo-${photoId}`,
            type: data.photosTypes?.[photoId] || "image/jpeg",
            fieldType: "photos"
          });
        });
      }
      
      // Process soil photos
      if (data.soilphotosIds && data.soilphotosIds.length > 0) {
        data.soilphotosIds.forEach((photoId: string) => {
          allAttachments.push({
            id: photoId,
            name: data.soilphotosNames?.[photoId] || `SoilPhoto-${photoId}`,
            type: data.soilphotosTypes?.[photoId] || "image/jpeg",
            fieldType: "soilphotos"
          });
        });
      }
      
      // Process PDF attachments
      if (data.pdfattachmentIds && data.pdfattachmentIds.length > 0) {
        data.pdfattachmentIds.forEach((pdfId: string) => {
          allAttachments.push({
            id: pdfId,
            name: data.pdfattachmentNames?.[pdfId] || `PDF-${pdfId}`,
            type: data.pdfattachmentTypes?.[pdfId] || "application/pdf",
            fieldType: "pdfattachment"
          });
        });
      }
      
      // Set all attachments
      setAttachments(allAttachments);
    } catch (error) {
      console.error("Error processing attachments:", error);
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  // Function to get status style
  const getStatusStyle = useCallback((status: string) => {
    const styles: Record<string, string> = {
      "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-100 text-green-800 border border-green-300",
      "ΑΠΟΣΤΟΛΗ": "bg-blue-100 text-blue-800 border border-blue-300",
      "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300",
      "ΑΠΟΡΡΙΨΗ": "bg-gray-100 text-gray-800 border border-gray-300",
      "ΝΕΟ": "bg-purple-100 text-purple-800 border border-purple-300",
      "ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ": "bg-yellow-100 text-yellow-800 border border-yellow-300",
      "ΑΚΥΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300"
    };
    return styles[status] || "bg-yellow-100 text-yellow-800 border border-yellow-300";
  }, []);

  // Function to get blowingDone style
  const getBlowingDoneStyle = useCallback((value: string | null | undefined) => {
    if (!value) return "text-gray-500";
    
    const styles: Record<string, string> = {
      "ΝΑΙ": "text-green-600 font-medium",
      "ΟΧΙ": "text-red-600 font-medium"
    };
    return styles[value] || "text-gray-700";
  }, []);

  // Handle tab changes
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);
  
  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, fieldType: string = "photos") => {
    if (!e.target.files || e.target.files.length === 0 || !malfunction?.id) return;
    
    const fileList = Array.from(e.target.files);
    
    try {
      setLoadingAttachments(true);
      
      // Upload files using the mutation
      await uploadAttachmentMutation.mutateAsync({
        id: malfunction.id,
        fieldType,
        files: fileList
      });
      
      // Refetch data to get updated attachments
      await refetch();
      
      toast({
        title: "Επιτυχία",
        description: "Τα αρχεία ανέβηκαν επιτυχώς",
        variant: "default",
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία μεταφόρτωσης αρχείων",
        variant: "destructive",
      });
    } finally {
      setLoadingAttachments(false);
    }
  }, [malfunction?.id, uploadAttachmentMutation, refetch, toast]);
  
  // Handle attachment deletion
  const handleDeleteAttachment = useCallback(async (attachmentId: string, fieldType: string) => {
    if (!malfunction?.id) return;
    
    try {
      setLoadingAttachments(true);
      
      // Delete attachment using the mutation
      await deleteAttachmentMutation.mutateAsync({
        id: malfunction.id,
        attachmentId,
        fieldType
      });
      
      // Update the UI by removing the deleted attachment
      setAttachments(prevAttachments => 
        prevAttachments.filter(att => att.id !== attachmentId)
      );
      
      // Refetch the malfunction data
      await refetch();
      
      toast({
        title: "Επιτυχία",
        description: "Το αρχείο διαγράφηκε επιτυχώς",
        variant: "default",
      });
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία διαγραφής αρχείου",
        variant: "destructive",
      });
    } finally {
      setLoadingAttachments(false);
    }
  }, [malfunction?.id, deleteAttachmentMutation, refetch, toast]);

  // Handle form input changes
  const handleInputChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }));
  }, []);

  // Save changes
  const handleSave = useCallback(async () => {
    if (!malfunction?.id) return;
    
    try {
      setSaving(true);
      
      // Extract only the fields that have changed
      const changedFields: Record<string, any> = {};
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== malfunction[key]) {
          changedFields[key] = formData[key];
        }
      });
      
      // Only make the request if there are changes
      if (Object.keys(changedFields).length > 0) {
        // Update malfunction using the mutation
        await updateMalfunctionMutation.mutateAsync({
          id: malfunction.id,
          data: changedFields
        });
        
        toast({
          title: "Επιτυχία",
          description: "Οι αλλαγές αποθηκεύτηκαν επιτυχώς",
          variant: "default",
        });
      }
      
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating malfunction:", error);
      toast({
        title: "Σφάλμα",
        description: "Αποτυχία αποθήκευσης αλλαγών",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [malfunction, formData, updateMalfunctionMutation, toast]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    // Reset form data to original malfunction data
    if (malfunction) {
      setFormData(malfunction);
    }
    setIsEditMode(false);
  }, [malfunction]);

  // Tab button component
  const TabButton = useCallback(({
    id,
    label,
    active,
    onClick,
    disabled,
    className = "",
    icon: IconComponent,
    count,
  }: {
    id: TabType;
    label: string;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
    icon: React.FC<{ size?: number; className?: string }>;
    count?: number;
  }) => {
    // Custom labels based on tab
    const displayLabel = id === "photos" ? "Επισυναπτόμενα" : label;
    
    const baseStyles = "px-4 py-2 text-sm font-medium transition-colors duration-150 flex items-center";
    const activeStyles = "text-blue-600 border-b-2 border-blue-600";
    const inactiveStyles = "text-gray-500 hover:text-gray-700 border-b-2 border-transparent";
    const disabledStyles = "text-gray-300 cursor-not-allowed border-b-2 border-transparent";
  
    return (
      <div className="relative group">
        <button
          onClick={onClick}
          disabled={disabled}
          className={`${baseStyles} ${
            active ? activeStyles : disabled ? disabledStyles : inactiveStyles
          } ${className}`}
          aria-selected={active}
          role="tab"
        >
          <IconComponent size={16} className="mr-2" />
          {displayLabel}
          {count !== undefined && count > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
              {count}
            </span>
          )}
        </button>
        {disabled && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Δεν υπάρχουν δεδομένα
          </div>
        )}
      </div>
    );
  }, []);

  // Calculate image and document counts from attachments
  const attachmentCounts = useMemo(() => {
    const imageCount = attachments.filter(att => 
      (att.type?.startsWith("image/") || 
      att.name.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i)) && 
      att.fieldType !== "pdfattachment"
    ).length;
    
    const pdfCount = attachments.filter(att => 
      att.type === "application/pdf" || 
      att.name.match(/\.pdf$/i) ||
      att.fieldType === "pdfattachment"
    ).length;
    
    const otherCount = attachments.filter(att => 
      !att.type?.startsWith("image/") && 
      att.type !== "application/pdf" &&
      !att.name.match(/\.(jpg|jpeg|png|gif|bmp|svg|pdf)$/i) &&
      att.fieldType !== "pdfattachment"
    ).length;
    
    return {
      images: imageCount,
      others: otherCount,
      nonPdfs: imageCount + otherCount, // Combined count for "Επισυναπτόμενα" tab
      pdfs: pdfCount
    };
  }, [attachments]);

  // Getting the counts for tabs
  const tabCounts = useMemo(() => ({
    photos: attachmentCounts.nonPdfs, // Only count non-PDF attachments
    pdfs: attachmentCounts.pdfs,
    teams: (malfunction?.teamsIds?.length || 0) + (malfunction?.usersIds?.length || 0),
  }), [malfunction, attachmentCounts]);
  
  // Check if tabs should be disabled
  const tabsAvailability = useMemo(() => ({
    details: true, // Always available
    photos: attachmentCounts.nonPdfs > 0 || isEditMode,
    pdfs: attachmentCounts.pdfs > 0 || isEditMode,
    teams: (malfunction?.teamsIds?.length || 0) > 0 || (malfunction?.usersIds?.length || 0) > 0,
  }), [malfunction, attachmentCounts.nonPdfs, attachmentCounts.pdfs, isEditMode]);

  // Rendering field values based on type
  const renderFieldValue = useCallback((field: string, value: any) => {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
      return <span className="text-gray-400">-</span>;
    }
    
    const fieldDef = fieldDefinitions[field] || { type: "varchar", label: field };
    
    switch (fieldDef.type) {
      case "enum":
        if (field === "status") {
          return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(value)}`}>
              {value}
            </span>
          );
        } else if (field === "blowingDone") {
          return <span className={getBlowingDoneStyle(value)}>{value}</span>;
        }
        return <span>{value}</span>;
        
      case "checklist":
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="space-y-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
        
      case "datetime":
        return <span>{formatDate(value)}</span>;
        
      case "url":
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline flex items-center gap-1"
          >
            <span>Άνοιγμα Link</span>
            <ExternalLink size={14} />
          </a>
        );
        
      case "text":
        return <span className="whitespace-pre-wrap">{value}</span>;
        
      case "bool":
        return <span>{value ? "Ναι" : "Όχι"}</span>;
        
      case "int":
        return <span>{value}</span>;
        
      default:
        return <span>{value}</span>;
    }
  }, [formatDate, getStatusStyle, getBlowingDoneStyle]);
  
  // Render edit field based on field type
  const renderEditField = useCallback((field: string, value: any) => {
    const fieldDef = fieldDefinitions[field] || { type: "varchar", label: field };
    
    switch (fieldDef.type) {
      case "enum":
        if (field === "status") {
          return (
            <select
              value={value || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Επιλέξτε...</option>
              <option value="ΝΕΟ">Νέο</option>
              <option value="ΑΠΟΣΤΟΛΗ">Αποστολή</option>
              <option value="ΟΛΟΚΛΗΡΩΣΗ">Ολοκλήρωση</option>
              <option value="ΜΗ ΟΛΟΚΛΗΡΩΣΗ">Μη Ολοκλήρωση</option>
              <option value="ΑΠΟΡΡΙΨΗ">Απόρριψη</option>
              <option value="ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ">Χειροκίνητος Προγραμματισμός</option>
            </select>
          );
        } else if (field === "blowingDone") {
          return (
            <select
              value={value || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Επιλέξτε...</option>
              <option value="ΝΑΙ">Ναι</option>
              <option value="ΟΧΙ">Όχι</option>
            </select>
          );
        } else if (field === "jobdescription") {
          return (
            <select
              value={value || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Επιλέξτε...</option>
              <option value="Καθαρισμός Φρεατίου">Καθαρισμός Φρεατίου</option>
              <option value="Αλλαγή Οπτικής Ίνας">Αλλαγή Οπτικής Ίνας</option>
              <option value="Μετάβαση Χωρίς Εργασία">Μετάβαση Χωρίς Εργασία</option>
              <option value="Επισκευή Οπτικής Ίνας">Επισκευή Οπτικής Ίνας</option>
            </select>
          );
        } else {
          return (
            <input
              type="text"
              value={value || ""}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        }
        
      case "checklist":
        // For simplicity, we'll use a comma-separated input for checklist fields
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(", ") : value || ""}
            onChange={(e) => {
              const newValue = e.target.value.split(",").map(item => item.trim());
              handleInputChange(field, newValue);
            }}
            placeholder="Comma-separated values"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      case "text":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            rows={4}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      case "bool":
        return (
          <select
            value={value ? "true" : "false"}
            onChange={(e) => handleInputChange(field, e.target.value === "true")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Ναι</option>
            <option value="false">Όχι</option>
          </select>
        );
        
      case "int":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  }, [handleInputChange]);

  // Helper function to check if a value should be displayed
  const hasDisplayableValue = useCallback((field: string, value: any): boolean => {
    // Special case for fields that we always want to show if they exist in the API response
    if (field === "type" || field === "jobdescription" || 
        field === "metravlavhcab" || field === "metravlavhbcpbep" || 
        field === "metravlavhbepfb" || field === "splittertype" || 
        field === "splitterbcp" || field === "moufarisma") {
      // If we're in edit mode, always show these fields
      if (isEditMode) return true;
      
      // Otherwise, only show them if they have a value
      if (value === null || value === undefined) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }
    
    // In edit mode, show all fields
    if (isEditMode) return true;
    
    // Null or undefined values should not be displayed
    if (value === null || value === undefined) return false;
    
    // Empty strings should not be displayed
    if (typeof value === "string" && value.trim() === "") return false;
    
    // Empty arrays should not be displayed
    if (Array.isArray(value) && value.length === 0) return false;
    
    // Zero number values should still be displayed
    if (typeof value === "number") return true;
    
    // Boolean values should be displayed
    if (typeof value === "boolean") return true;
    
    // All other values should be displayed
    return true;
  }, [isEditMode]);
  
  // Render details content
  const renderDetailsContent = useCallback(() => {
    if (!malfunction) return null;
    
    return (
      <div className="space-y-6">
        {/* Render each section based on the layout definition */}
        {fieldSections.map((section) => {
          // Check if section should be shown based on condition
          if (section.condition && !section.condition(malfunction)) {
            return null;
          }
          
          // Filter out fields that have no value
          const fieldsWithValues = section.fields.filter(field => {
            // Skip attachment fields in the details tab
            if (field === "photos" || field === "soilphotos" || field === "pdfattachment") {
              return false;
            }
            
            // Always include specific sections even if empty when in edit mode
            if ((section.id === "section4" || section.id === "section5") && isEditMode) {
              return true;
            }
            
            // Check if field exists in malfunction and has a displayable value
            const value = isEditMode ? 
              formData[field] : 
              malfunction[field];
            
            return hasDisplayableValue(field, value);
          });
          
          // If no fields have values and we're not in sections that should always show in edit mode, hide the section
          if (fieldsWithValues.length === 0 && 
              !(isEditMode && (section.id === "section4" || section.id === "section5"))) {
            return null;
          }
          
          return (
            <div key={section.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                {section.id === "section1" && <FileText size={20} className="text-gray-500" />}
                {section.id === "section2" && <Building2 size={20} className="text-gray-500" />}
                {section.id === "section3" && <ClipboardList size={20} className="text-gray-500" />}
                {section.id === "section4" && <Shovel size={20} className="text-gray-500" />}
                {section.id === "section5" && <Layers size={20} className="text-gray-500" />}
                {section.label}
              </h2>
              
              <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-sm">
                {fieldsWithValues.map((field) => {
                  const value = isEditMode ? 
                    formData[field] : 
                    malfunction[field];
                  
                  const label = fieldDefinitions[field]?.label || field;
                  
                  // Skip rendering if the field shouldn't be displayed
                  if (!hasDisplayableValue(field, value) && !isEditMode) {
                    return null;
                  }
                  
                  return (
                    <React.Fragment key={field}>
                      <span className="text-gray-600">{label}:</span>
                      <div>
                        {isEditMode ? (
                          renderEditField(field, value)
                        ) : (
                          renderFieldValue(field, value)
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
  
        {/* Assignment Information - only show if there's data or in edit mode */}
        {(isEditMode || malfunction.assignedUserName || (malfunction.usersIds && malfunction.usersIds.length > 0)) && (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <div className="space-y-3">
              {(isEditMode || malfunction.assignedUserName) && (
                <div className="flex items-center gap-3">
                  <Wrench className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Υπεύθυνος Τεχνικός</p>
                    {malfunction.assignedUserName ? (
                      <p className="text-gray-600">{malfunction.assignedUserName}</p>
                    ) : isEditMode ? (
                      <p className="text-gray-400 italic">Δεν έχει οριστεί</p>
                    ) : null}
                  </div>
                </div>
              )}
              
              {(isEditMode || (malfunction.usersIds && malfunction.usersIds.length > 0)) && (
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Ανατεθειμένοι Χρήστες</p>
                    {malfunction.usersIds && malfunction.usersIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {malfunction.usersIds.map((userId: string) => (
                          <span key={userId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                            {malfunction.usersNames?.[userId] || userId}
                          </span>
                        ))}
                      </div>
                    ) : isEditMode ? (
                      <p className="text-gray-400 italic">Δεν έχουν οριστεί</p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
  
        {/* Creation/Modification Information - always show this section */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={20} className="text-gray-500" />
            Πληροφορίες Συστήματος
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Δημιουργήθηκε από:</p>
              <p>{malfunction.createdByName || "N/A"} | {formatDate(malfunction.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-600">Τελευταία τροποποίηση:</p>
              <p>{malfunction.modifiedByName || "N/A"} | {formatDate(malfunction.modifiedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }, [malfunction, formData, formatDate, isEditMode, renderFieldValue, renderEditField, hasDisplayableValue]);

  // Render photos content (non-PDF attachments)
  const renderPhotosContent = useCallback(() => {
    // Filter only non-PDF attachments
    const nonPdfAttachments = attachments.filter(att => 
      !(att.type === "application/pdf" || att.name.match(/\.pdf$/i)) &&
      att.fieldType !== "pdfattachment"
    );
    
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Image size={20} className="text-gray-500" />
            Φωτογραφίες και Λοιπά Αρχεία
          </h2>
          
          {isEditMode && (
            <div className="flex flex-wrap gap-3">
              <div>
                <label htmlFor="photos-upload" className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded-lg border border-blue-200 flex items-center gap-2 transition-colors">
                  <Upload size={16} />
                  <span>Φωτογραφίες</span>
                </label>
                <input 
                  id="photos-upload" 
                  type="file" 
                  multiple 
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "photos")}
                  accept="image/*"
                />
              </div>
              
              <div>
                <label htmlFor="soilphotos-upload" className="cursor-pointer bg-green-50 hover:bg-green-100 text-green-600 py-2 px-4 rounded-lg border border-green-200 flex items-center gap-2 transition-colors">
                  <Upload size={16} />
                  <span>Φωτογραφίες Χώματος</span>
                </label>
                <input 
                  id="soilphotos-upload" 
                  type="file" 
                  multiple 
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "soilphotos")}
                  accept="image/*"
                />
              </div>
              
              <div>
                <label htmlFor="other-upload" className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-4 rounded-lg border border-gray-200 flex items-center gap-2 transition-colors">
                  <Upload size={16} />
                  <span>Άλλα Αρχεία</span>
                </label>
                <input 
                  id="other-upload" 
                  type="file" 
                  multiple 
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "photos")}
                  accept=".doc,.docx,.xlsx,.xls,.txt"
                />
              </div>
            </div>
          )}
        </div>
        
        {loadingAttachments ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span>Loading attachments...</span>
          </div>
        ) : nonPdfAttachments.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Image size={48} className="text-gray-400" />
              <p className="text-gray-500">
                {isEditMode 
                  ? "Δεν υπάρχουν συνημμένα αρχεία. Κάντε κλικ στα κουμπιά προσθήκης για να ανεβάσετε."
                  : "Δεν υπάρχουν διαθέσιμα συνημμένα αρχεία."
                }
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Photos */}
            {nonPdfAttachments.filter(att => att.fieldType === "photos" && att.type?.startsWith("image/")).length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Φωτογραφίες
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nonPdfAttachments
                    .filter(att => att.fieldType === "photos" && att.type?.startsWith("image/"))
                    .map(attachment => (
                      <div key={attachment.id} className="relative group">
                        <div className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
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
                          {isEditMode && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.fieldType)}
                              className="p-1 text-red-600 hover:text-red-800 rounded"
                              title="Delete"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Soil Photos */}
            {nonPdfAttachments.filter(att => att.fieldType === "soilphotos").length > 0 && (
              <div className="mb-6">
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Φωτογραφίες Χώματος
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {nonPdfAttachments
                    .filter(att => att.fieldType === "soilphotos")
                    .map(attachment => (
                      <div key={attachment.id} className="relative group">
                        <div className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
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
                          {isEditMode && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.fieldType)}
                              className="p-1 text-red-600 hover:text-red-800 rounded"
                              title="Delete"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {/* Other Files */}
            {nonPdfAttachments.filter(att => att.fieldType === "photos" && !att.type?.startsWith("image/")).length > 0 && (
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">
                  Λοιπά Αρχεία
                </h3>
                <div className="space-y-2">
                  {nonPdfAttachments
                    .filter(att => att.fieldType === "photos" && !att.type?.startsWith("image/"))
                    .map(attachment => (
                      <div key={attachment.id} className="p-3 bg-white rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-blue-500" />
                          <div>
                            <p className="font-medium">{attachment.name}</p>
                            <p className="text-xs text-gray-500">{attachment.type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
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
                              onClick={() => handleDeleteAttachment(attachment.id, attachment.fieldType)}
                              className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [attachments, loadingAttachments, isEditMode, handleDeleteAttachment, handleFileUpload]);

  // Render PDFs content (PDF attachments)
  const renderPdfsContent = useCallback(() => {
    // Filter only PDF attachments
    const pdfAttachments = attachments.filter(att => 
      att.type === "application/pdf" || 
      att.name.match(/\.pdf$/i) ||
      att.fieldType === "pdfattachment"
    );
    
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FileArchiveIcon size={20} className="text-gray-500" />
            Έγγραφα PDF
          </h2>
          
          {isEditMode && (
            <div>
              <label htmlFor="pdf-upload" className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 px-4 rounded-lg border border-blue-200 flex items-center gap-2 transition-colors">
                <Upload size={16} />
                <span>Προσθήκη PDF</span>
              </label>
              <input 
                id="pdf-upload" 
                type="file" 
                className="hidden"
                onChange={(e) => handleFileUpload(e, "pdfattachment")}
                accept=".pdf,application/pdf"
              />
            </div>
          )}
        </div>
        
        {loadingAttachments ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span>Loading PDF documents...</span>
          </div>
        ) : pdfAttachments.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <FileArchiveIcon size={48} className="text-gray-400" />
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
              {pdfAttachments.map((attachment) => {
                return (
                  <div 
                    key={attachment.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedPdf === attachment.id 
                        ? "bg-blue-50 border-blue-200" 
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    } transition-colors cursor-pointer`}
                    onClick={() => {
                      setSelectedPdf(attachment.id);
                      setPdfPreviewUrl(`/api/attachments/${attachment.id}`);
                    }}
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
                        href={`/api/attachments/${attachment.id}?download=true`}
                        download={attachment.name}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
                        title="Download document"
                      >
                        <Download size={16} />
                      </a>
                      {isEditMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAttachment(attachment.id, attachment.fieldType);
                          }}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                          title="Delete document"
                        >
                          <Trash size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* PDF Viewer */}
            <div className="lg:col-span-8 bg-white p-2 rounded-lg border border-gray-200">
              {selectedPdf && pdfPreviewUrl ? (
                <div className="relative h-[70vh]">
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-full rounded border border-gray-200"
                    title={pdfAttachments.find(a => a.id === selectedPdf)?.name || "PDF Preview"}
                  />
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <a
                      href={pdfPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <a
                      href={`${pdfPreviewUrl}?download=true`}
                      download
                      className="p-2 bg-white rounded-full shadow hover:bg-gray-100 transition-colors"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
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
  }, [attachments, loadingAttachments, isEditMode, handleDeleteAttachment, handleFileUpload, selectedPdf, pdfPreviewUrl]);

  // Clean up any blob URLs when component unmounts or PDF selection changes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl && pdfPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Render teams and users content
  const renderTeamsContent = useCallback(() => {
    if (!malfunction) return null;
    
    const hasTeams = malfunction.teamsIds && malfunction.teamsIds.length > 0;
    const hasUsers = malfunction.usersIds && malfunction.usersIds.length > 0;
    
    if (!hasTeams && !hasUsers) {
      return (
        <div className="text-center py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Users size={48} className="text-gray-400" />
            <p className="text-gray-500">Δεν υπάρχουν ανατεθειμένες ομάδες ή χρήστες.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {/* Teams */}
        {hasTeams && (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-gray-500" />
              Ομάδες
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {malfunction.teamsIds?.map((teamId) => (
                <div key={teamId} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full">
                      <Users size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{malfunction.teamsNames?.[teamId] || "Ομάδα"}</p>
                      <p className="text-sm text-gray-500">ID: {teamId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Users */}
        {hasUsers && (
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} className="text-gray-500" />
              Χρήστες
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {malfunction.usersIds?.map((userId) => (
                <div key={userId} className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-700 rounded-full">
                      <Wrench size={18} />
                    </div>
                    <div>
                      <p className="font-medium">{malfunction.usersNames?.[userId] || "Χρήστης"}</p>
                      <p className="text-sm text-gray-500">ID: {userId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [malfunction]);

  // Render the active tab content
  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case "details":
        return renderDetailsContent();
      case "photos":
        return renderPhotosContent();
      case "pdfs":
        return renderPdfsContent();
      case "teams":
        return renderTeamsContent();
      default:
        return renderDetailsContent();
    }
  }, [activeTab, renderDetailsContent, renderPhotosContent, renderPdfsContent, renderTeamsContent]);

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-xl text-gray-700">Φόρτωση στοιχείων βλάβης...</span>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={24} />
            <span className="text-xl">Παρουσιάστηκε σφάλμα κατά τη φόρτωση των δεδομένων</span>
          </div>
          <button
            onClick={() => router.push("/ftthbphase/malfunctions")}
            className="flex items-center gap-2 text-blue-500 hover:underline"
          >
            <ArrowLeft size={20} />
            Επιστροφή στη λίστα
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!malfunction) return null;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Header */}
          <div className="p-4 space-y-4">
            <Link href="/ftthbphase/malfunctions" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors">
              <ArrowLeft size={20} />
              <span className="font-medium">Πίσω στη λίστα</span>
            </Link>
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{malfunction.name}</h1>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(malfunction.status)}`}
                    >
                      {malfunction.status}
                    </span>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={16} />
                      <span className="text-sm">{formatDate(malfunction.datecreated || malfunction.createdAt)}</span>
                    </div>
                    {malfunction.idvlavis && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Tag size={16} />
                        <span className="text-sm">ID: {malfunction.idvlavis}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                      >
                        <X size={16} />
                        <span>Ακύρωση</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-green-600 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {saving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Αποθήκευση...</span>
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            <span>Αποθήκευση</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Pencil size={16} />
                      <span>Επεξεργασία</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-4">
            <div className="flex flex-col sm:flex-row sm:space-x-4">
              <TabButton
                id="details"
                label="Λεπτομέρειες"
                active={activeTab === "details"}
                onClick={() => handleTabChange("details")}
                disabled={false}
                className="text-base px-4 py-2"
                icon={FileText}
              />
              <TabButton
                id="photos"
                label="Επισυναπτόμενα"
                active={activeTab === "photos"}
                onClick={() => handleTabChange("photos")}
                disabled={!tabsAvailability.photos}
                className="text-base px-4 py-2"
                icon={Image}
                count={tabCounts.photos}
              />
              <TabButton
                id="pdfs"
                label="PDF"
                active={activeTab === "pdfs"}
                onClick={() => handleTabChange("pdfs")}
                disabled={!tabsAvailability.pdfs}
                className="text-base px-4 py-2"
                icon={FileArchiveIcon}
                count={tabCounts.pdfs}
              />
              <TabButton
                id="teams"
                label="Ομάδες & Χρήστες"
                active={activeTab === "teams"}
                onClick={() => handleTabChange("teams")}
                disabled={!tabsAvailability.teams}
                className="text-base px-4 py-2"
                icon={Users}
                count={tabCounts.teams}
              />
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            {renderTabContent()}
          </div>

          {/* Map Section (if coordinates are available) */}
          {((malfunction.lat && malfunction.long) || (malfunction.latitude && malfunction.longitude)) && (
            <div className="p-4 border-t border-gray-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-gray-500" />
                Τοποθεσία στον Χάρτη
              </h2>
              <div className="h-96">
                <GoogleMap
                  latitude={parseFloat(malfunction.lat || malfunction.latitude || "0")}
                  longitude={parseFloat(malfunction.long || malfunction.longitude || "0")}
                  address={malfunction.address || ""}
                />
              </div>
              <div className="mt-4 flex justify-end">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(malfunction.lat || malfunction.latitude || "0")},${encodeURIComponent(malfunction.long || malfunction.longitude || "0")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-500 hover:underline"
                >
                  <span>Άνοιγμα στο Google Maps</span>
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}