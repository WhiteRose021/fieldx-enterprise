"use client";
import { useState, useEffect, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBell, 
  faUserPlus, 
  faEdit, 
  faTrash, 
  faPlus, 
  faComment,
  faUser,
  faClock,
  faCircleInfo,
  faArrowRight,
  faFilter,
  faSort,
  faCheck,
  faEye,
  faEyeSlash,
  faCog,
  faChevronLeft,
  faChevronRight,
  faSearch,
  faExclamationTriangle,
  faExclamation,
  faCheckCircle,
  faTimesCircle,
  faTags,
  faFemale,
  faMale
} from "@fortawesome/free-solid-svg-icons";
import ClickOutside from "@/components/ClickOutside";

// Define application-wide font styles
const fontStyles = {
  heading: "text-gray-800 font-medium",
  body: "text-gray-700",
  small: "text-xs text-gray-500",
  link: "text-blue-600 hover:text-blue-800 hover:underline",
  button: "text-sm font-medium"
};

// Status mapping for proper display and colors
const statusMapping = {
  // Greek status mapping (uppercase to proper case)
  "ΝΕΟ": { text: "Νέο", color: "text-purple-600", bgColor: "bg-purple-100" },
  "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": { text: "Μη Ολοκλήρωση", color: "text-orange-600", bgColor: "bg-orange-100" },
  "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ": { text: "Προγραμματισμένο", color: "text-blue-600", bgColor: "bg-blue-100" },
  "ΣΕ ΕΞΕΛΙΞΗ": { text: "Σε Εξέλιξη", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  "ΟΛΟΚΛΗΡΩΜΕΝΟ": { text: "Ολοκληρωμένο", color: "text-green-600", bgColor: "bg-green-100" },
  "ΑΚΥΡΩΜΕΝΟ": { text: "Ακυρωμένο", color: "text-red-600", bgColor: "bg-red-100" },
  "ΑΠΟΣΤΟΛΗ": { text: "Αποστολή", color: "text-blue-600", bgColor: "bg-blue-100" },
  
  // English status mapping (if needed)
  "NEW": { text: "New", color: "text-purple-600", bgColor: "bg-purple-100" },
  "NOT COMPLETED": { text: "Not Completed", color: "text-orange-600", bgColor: "bg-orange-100" },
  "SCHEDULED": { text: "Scheduled", color: "text-blue-600", bgColor: "bg-blue-100" },
  "IN PROGRESS": { text: "In Progress", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  "COMPLETED": { text: "Completed", color: "text-green-600", bgColor: "bg-green-100" },
  "CANCELLED": { text: "Cancelled", color: "text-red-600", bgColor: "bg-red-100" },
  "SENT": { text: "Sent", color: "text-blue-600", bgColor: "bg-blue-100" }
};

// Style to color mapping for notification styling
const styleColorMapping = {
  "danger": { color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-300" },
  "warning": { color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-300" },
  "success": { color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-300" },
  "primary": { color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-300" },
  "info": { color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-300" }
};

// Entity type mapping with proper labels and colors
const entityTypeMapping = {
  // Autopsies related - Blue colors
  "Aytopsies1": { text: "Αυτοψία", color: "text-blue-600", bgColor: "bg-blue-100" },
  "OutsideAytopsiesC": { text: "Εξωσυστημική Αυτοψία", color: "text-blue-700", bgColor: "bg-blue-100" },
  "CPilotAutopsies": { text: "Πιλοτική Αυτοψία", color: "text-blue-800", bgColor: "bg-blue-100" },
  "Test": { text: "Ραντεβού Αυτοψίας", color: "text-blue-600", bgColor: "bg-blue-50" },
  
  // Soil/Earth related - Yellow/Mustard colors
  "Chomatourgika": { text: "Χωματουργικά", color: "text-yellow-700", bgColor: "bg-yellow-100" },
  "CEarthWork": { text: "Ραντεβού Χωματουργικού", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  
  // Construction related - Green colors
  "KataskeyastikadatesC": { text: "Ραντεβού Κατασκευαστικού", color: "text-green-600", bgColor: "bg-green-50" },
  "KataskeyesBFasi": { text: "Κατασκευές", color: "text-green-700", bgColor: "bg-green-100" },
  "KataskeyesFTTH": { text: "Κατασκευές Last Drop", color: "text-green-800", bgColor: "bg-green-100" },
  "Ktiria": { text: "ΧΕΜΔ", color: "text-green-600", bgColor: "bg-green-100" },
  
  // Splicing related - Purple colors
  "SplicingWorkC": { text: "Κόλληση", color: "text-purple-700", bgColor: "bg-purple-100" },
  "Splicingdate": { text: "Ραντεβού Κόλλησης", color: "text-purple-600", bgColor: "bg-purple-50" },
  
  // Last Drop related - Indigo colors
  "LastDropDatesC": { text: "Ραντεβού Last Drop", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  
  // Infusion related - Cyan colors
  "CEmfyshsh": { text: "Εμφύσηση", color: "text-cyan-700", bgColor: "bg-cyan-100" },
  "RantevouEmfC": { text: "Ραντεβού Εμφύσησης", color: "text-cyan-600", bgColor: "bg-cyan-50" },
  
  // Technical related - Grey colors
  "Texnikoselegxos": { text: "Τεχνικός Έλεγχος", color: "text-gray-700", bgColor: "bg-gray-100" },
  "Tobbs": { text: "To-Be-Built", color: "text-gray-600", bgColor: "bg-gray-100" },
  
  // Support related - Orange colors
  "Case": { text: "Support Ticket", color: "text-orange-600", bgColor: "bg-orange-50" },
  "Vlaves": { text: "Βλάβη", color: "text-orange-700", bgColor: "bg-orange-100" },
  
  // Billing related - Pink colors
  "CBilling": { text: "Τιμολόγηση", color: "text-pink-600", bgColor: "bg-pink-50" },
  
  // Communication related - Teal colors
  "SmsSenderC": { text: "SMS", color: "text-teal-600", bgColor: "bg-teal-50" },
  "CChatConversation": { text: "Συνομιλία", color: "text-teal-700", bgColor: "bg-teal-100" },
  "CChatMessage": { text: "Μήνυμα", color: "text-teal-600", bgColor: "bg-teal-50" },
  
  // Other types
  "Dummy": { text: "Έντυπο Τεχνικής Επιθεώρησης", color: "text-gray-600", bgColor: "bg-gray-50" },
  "Meeting": { text: "Ραντεβού Γ' Φάση", color: "text-violet-600", bgColor: "bg-violet-50" },
  "Note": { text: "Σημείωση", color: "text-gray-600", bgColor: "bg-gray-50" },
  "Task": { text: "Εργασία", color: "text-gray-700", bgColor: "bg-gray-100" },
  "Contact": { text: "Επαφή", color: "text-gray-600", bgColor: "bg-gray-50" },
  "Document": { text: "Έγγραφο", color: "text-gray-600", bgColor: "bg-gray-50" },
  "Email": { text: "Email", color: "text-gray-600", bgColor: "bg-gray-50" }
};

// Helper function to get entity type information
const getEntityTypeInfo = (entityType: string | undefined): { text: string; color: string; bgColor: string } => {
  if (!entityType) return { text: "Unknown", color: "text-gray-600", bgColor: "bg-gray-50" };
  
  // Type assertion to help TypeScript understand this is a valid key
  const mappedEntity = entityTypeMapping[entityType as keyof typeof entityTypeMapping];
  if (mappedEntity) return mappedEntity;
  
  // Default formatting for unmapped entities
  return {
    text: entityType.replace(/([A-Z])/g, ' $1').trim(), // Convert camelCase to Spaced Words
    color: "text-gray-600",
    bgColor: "bg-gray-50"
  };
};


// Format status text with proper styling
const formatStatus = (status: string | undefined): { text: string; color: string; bgColor: string } => {
  if (!status) return { text: "Unknown", color: "text-gray-600", bgColor: "bg-gray-100" };
  
  // Check if the status is in our mapping (with type assertion)
  const mappedStatus = statusMapping[status.toUpperCase() as keyof typeof statusMapping];
  if (mappedStatus) return mappedStatus;
  
  // Default formatting for unmapped statuses
  return {
    text: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
    color: "text-gray-600",
    bgColor: "bg-gray-100"
  };
};

interface NotificationData {
  id: string;
  deleted: boolean;
  number: number;
  data?: {
    noteId?: string;
    [key: string]: any;
  };
  noteData?: {
    id?: string;
    deleted?: boolean;
    type?: string;
    createdAt?: string;
    parentId?: string;
    parentName?: string;
    parentType?: string;
    createdById?: string;
    createdByName?: string;
    createdByGender?: string | null;
    post?: string | null;
    isInternal?: boolean;
    priority?: 'low' | 'medium' | 'high';
    style?: string;
    data?: {
      field?: string;
      value?: string;
      style?: string;
      fields?: string[];
      assignedUserId?: string;
      assignedUserName?: string;
      attributes?: {
        was?: Record<string, string>;
        became?: Record<string, string>;
      };
    };
  };
  type: string;
  read: boolean;
  createdAt: string;
  userId: string;
  userName: string;
  relatedId: string;
  relatedType: string;
  relatedParentId: string;
  relatedParentType: string;
}

type FilterType = 'all' | 'unread' | 'read';
type SortType = 'newest' | 'oldest' | 'priority';
type NotificationType = 'assign' | 'update' | 'delete' | 'create' | 'post' | 'status' | 'all';

interface NotificationSettings {
  showTypes: Record<NotificationType, boolean>;
  maxItems: number;
  autoRefresh: boolean;
  refreshInterval: number; // in seconds
}

const DEFAULT_SETTINGS: NotificationSettings = {
  showTypes: {
    assign: true,
    update: true,
    delete: true,
    create: true,
    post: true,
    status: true,
    all: true
  },
  maxItems: 10,
  autoRefresh: true,
  refreshInterval: 30
};

const NotificationBadge = ({ count }: { count: number }) => (
  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
    {count}
  </span>
);

const getNotificationIcon = (notification: NotificationData) => {
  const type = notification.noteData?.type?.toLowerCase();
  
  // Special handling for Status notifications based on the style
  if (type === "status") {
    switch (notification.noteData?.data?.style) {
      case "success": return faCheckCircle;
      case "warning": return faExclamation;
      case "danger": return faTimesCircle;
      case "primary": return faTags;
      default: return faCircleInfo;
    }
  }
  
  // Standard notification types
  switch (type) {
    case "assign": return faUserPlus;
    case "update": return faEdit;
    case "delete": return faTrash;
    case "create": return faPlus;
    case "post": return faComment;
    default: return faCircleInfo;
  }
};

const getNotificationIconColor = (notification: NotificationData) => {
  if (notification.read) return "text-gray-500";
  
  const type = notification.noteData?.type?.toLowerCase();
  
  // For Status notifications, use style to determine color
  if (type === "status") {
    switch (notification.noteData?.data?.style) {
      case "success": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "danger": return "text-red-600";
      case "primary": return "text-blue-600";
      default: return "text-gray-600";
    }
  }
  
  // For standard notification types
  switch (type) {
    case "assign": return "text-blue-600";
    case "update": return "text-green-600";
    case "delete": return "text-red-600";
    case "create": return "text-purple-600";
    case "post": return "text-yellow-600";
    default: return "text-blue-600";
  }
};

const getPriorityClass = (notification: NotificationData) => {
  // Use priority if it exists
  if (notification.noteData?.priority) {
    switch (notification.noteData.priority) {
      case "high": return "border-l-4 border-red-500";
      case "medium": return "border-l-4 border-yellow-500";
      case "low": return "border-l-4 border-green-500";
      default: return "";
    }
  }
  
  // Use style for status notifications if priority is not available
  if (notification.noteData?.type?.toLowerCase() === "status" && notification.noteData?.data?.style) {
    switch (notification.noteData.data.style) {
      case "success": return "border-l-4 border-green-500";
      case "warning": return "border-l-4 border-yellow-500";
      case "danger": return "border-l-4 border-red-500";
      case "primary": return "border-l-4 border-blue-500";
      default: return "";
    }
  }
  
  return "";
};

// Original function for backward compatibility
const getNotificationDetails = (notification: NotificationData) => {
  const { type, data, createdByName, parentName } = notification.noteData || {};
  
  // Construct a detailed description based on the notification type
  switch (type?.toLowerCase()) {
    case "update":
      if (data?.fields && data.attributes) {
        const field = data.fields[0];
        const wasValue = data.attributes.was?.[field];
        const becameValue = data.attributes.became?.[field];
        return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${wasValue} → ${becameValue}`;
      }
      return "Status updated";
    
    case "status":
      if (data?.field && data?.value) {
        return `Status changed to ${data.value}`;
      }
      return "Status changed";
    
    case "create":
      return `Created new item in ${parentName}`;
    
    case "delete":
      return `Deleted item from ${parentName}`;
    
    case "assign":
      if (data?.assignedUserName) {
        return `${parentName} assigned to ${data.assignedUserName}`;
      }
      return `You were assigned to ${parentName}`;
      
    case "post":
      if (notification.noteData?.post) {
        return `Comment: "${notification.noteData.post}"`;
      }
      return `New comment on ${parentName}`;
    
    default:
      return "New notification";
  }
};

// Enhanced function that returns rich status information
const getEnhancedNotificationDetails = (notification: NotificationData) => {
  const { type, data, createdByName, parentName } = notification.noteData || {};
  
  // Special handling for status updates
  if (type?.toLowerCase() === "status" || type?.toLowerCase() === "update") {
    // Handle different data structures for status updates
    
    // Case 1: Direct status field update (from Note API format)
    if (data?.field === "status" || data?.field === "κατάσταση") {
      const newStatus = data.value;
      const styleInfo = data.style ? styleColorMapping[data.style as keyof typeof styleColorMapping] : null;
      
      if (newStatus) {
        const formatted = formatStatus(newStatus);
        return {
          text: "Status changed to",
          newStatus: {
            text: formatted.text,
            color: formatted.color,
            bgColor: formatted.bgColor
          },
          hasStatusChange: true,
          parentName: parentName,
          style: styleInfo,
          entityId: notification.noteData?.parentId
        };
      }
    }
    
    // Case 2: Status update with was/became fields (from Update notification type)
    if (data?.fields && data.attributes && data.fields.includes("status")) {
      const oldStatus = data.attributes.was?.status;
      const newStatus = data.attributes.became?.status;
      
      if (oldStatus && newStatus) {
        const formattedOld = formatStatus(oldStatus);
        const formattedNew = formatStatus(newStatus);
        
        return {
          text: "Status changed from",
          oldStatus: {
            text: formattedOld.text,
            color: formattedOld.color,
            bgColor: formattedOld.bgColor
          },
          newStatus: {
            text: formattedNew.text,
            color: formattedNew.color,
            bgColor: formattedNew.bgColor
          },
          hasStatusChange: true,
          parentName: parentName,
          entityId: notification.noteData?.parentId
        };
      } else if (newStatus) {
        const formatted = formatStatus(newStatus);
        return {
          text: "Status set to",
          newStatus: {
            text: formatted.text,
            color: formatted.color,
            bgColor: formatted.bgColor
          },
          hasStatusChange: true,
          parentName: parentName,
          entityId: notification.noteData?.parentId
        };
      }
    }
    
    // Check for other field changes that might contain status information
    const statusRegex = /(status|κατάσταση)/i;
    if (data?.fields?.some(field => statusRegex.test(field)) && data.attributes) {
      const statusField = data.fields.find(field => statusRegex.test(field));
      if (statusField) {
        const oldStatus = data.attributes.was?.[statusField];
        const newStatus = data.attributes.became?.[statusField];
        
        if (oldStatus && newStatus) {
          const formattedOld = formatStatus(oldStatus);
          const formattedNew = formatStatus(newStatus);
          
          return {
            text: "Status changed from",
            oldStatus: {
              text: formattedOld.text,
              color: formattedOld.color,
              bgColor: formattedOld.bgColor
            },
            newStatus: {
              text: formattedNew.text,
              color: formattedNew.color,
              bgColor: formattedNew.bgColor
            },
            hasStatusChange: true,
            parentName: parentName,
            entityId: notification.noteData?.parentId
          };
        }
      }
    }
  }
  
  // For non-status notifications, use the original function
  return {
    text: getNotificationDetails(notification),
    hasStatusChange: false,
    parentName: parentName,
    entityId: notification.noteData?.parentId
  };
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "Just now";
  
  try {
    // Parse the date and apply the 2-hour offset to fix server time difference
    const date = new Date(dateString);
    date.setHours(date.getHours() + 2); // Add 2 hours to correct server time
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    
    // More detailed date format for older notifications
    return date.toLocaleDateString("el-GR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown date";
  }
};

interface NotificationLink {
  url: string;
  label: string;
}

const getNotificationLink = (notification: NotificationData): NotificationLink | null => {
  // Base URL for the application
  const baseUrl = "http://192.168.4.20:3001";
  
  // Check if we have a parent to link to
  if (notification.noteData?.parentId && notification.noteData?.parentType) {
    // Map the notification type to the corresponding URL path
    const typeUrlMap: Record<string, string> = {
      "Aytopsies1": "FTTHBPhase/Autopsies",
      // Add other type mappings as needed
      // For example:
      // "Task": "Tasks",
      // "Project": "Projects",
      // etc.
    };
    
    // Get the URL path based on the notification type
    const urlPath = typeUrlMap[notification.noteData.parentType] || notification.noteData.parentType;
    
    return {
      url: `${baseUrl}/${urlPath}/${notification.noteData.parentId}`,
      label: notification.noteData.parentName || 'View details'
    };
  }
  
  // Fallback to related parent if available
  if (notification.relatedParentId && notification.relatedParentType) {
    // Map the notification type to the corresponding URL path
    const typeUrlMap: Record<string, string> = {
      "Aytopsies1": "FTTHBPhase/Autopsies",
      // Add other type mappings as needed
    };
    
    // Get the URL path based on the notification type
    const urlPath = typeUrlMap[notification.relatedParentType] || notification.relatedParentType;
    
    return {
      url: `${baseUrl}/${urlPath}/${notification.relatedParentId}`,
      label: notification.noteData?.parentName || 'View details'
    };
  }
  
  return null;
};

const SettingsPanel = ({ 
  settings, 
  onSettingsChange, 
  onClose 
}: { 
  settings: NotificationSettings; 
  onSettingsChange: (newSettings: NotificationSettings) => void;
  onClose: () => void;
}) => {
  const [localSettings, setLocalSettings] = useState<NotificationSettings>({...settings});
  
  const handleToggleType = (type: NotificationType) => {
    if (type === 'all') {
      const newValue = !localSettings.showTypes.all;
      setLocalSettings({
        ...localSettings,
        showTypes: {
          assign: newValue,
          update: newValue,
          delete: newValue,
          create: newValue,
          post: newValue,
          all: newValue,
          status: newValue
        }
      });
    } else {
      const newTypes = {
        ...localSettings.showTypes,
        [type]: !localSettings.showTypes[type]
      };
      
      // Update 'all' based on other values
      const allEnabled = Object.entries(newTypes)
        .filter(([key]) => key !== 'all')
        .every(([_, value]) => value);
        
      setLocalSettings({
        ...localSettings,
        showTypes: {
          ...newTypes,
          all: allEnabled
        }
      });
    }
  };
  
  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };
  
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
        <h3 className={`${fontStyles.heading}`}>Notification Settings</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className={`${fontStyles.body} font-medium`}>Show Notification Types</div>
        
        <div className="ml-2 space-y-2">
          {Object.entries(localSettings.showTypes).map(([type, enabled]) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={() => handleToggleType(type as NotificationType)}
                className="rounded text-blue-600"
              />
              <span className={`text-sm ${fontStyles.body} capitalize`}>{type === 'all' ? 'All Types' : type}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className={`${fontStyles.body} font-medium`}>Display Settings</div>
        
        <div className="ml-2 space-y-3">
          <div className="flex flex-col">
            <label className={`text-sm ${fontStyles.body} mb-1`}>Max Items to Display</label>
            <select 
              value={localSettings.maxItems} 
              onChange={(e) => setLocalSettings({...localSettings, maxItems: parseInt(e.target.value)})}
              className="border border-gray-300 rounded-md p-1.5 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-sm ${fontStyles.body}`}>Auto-refresh</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={localSettings.autoRefresh}
                onChange={() => setLocalSettings({...localSettings, autoRefresh: !localSettings.autoRefresh})}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-aspro after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {localSettings.autoRefresh && (
            <div className="flex flex-col">
              <label className={`text-sm ${fontStyles.body} mb-1`}>Refresh Interval (seconds)</label>
              <select
                value={localSettings.refreshInterval}
                onChange={(e) => setLocalSettings({...localSettings, refreshInterval: parseInt(e.target.value)})}
                className="border border-gray-300 rounded-md p-1.5 text-sm"
              >
                <option value={15}>15</option>
                <option value={30}>30</option>
                <option value={60}>60</option>
                <option value={300}>300 (5 minutes)</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="pt-3 border-t border-gray-200 flex justify-end space-x-2">
        <button 
          onClick={onClose}
          className={`px-3 py-1.5 border border-gray-300 rounded-md ${fontStyles.button} text-gray-700 hover:bg-gray-50`}
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className={`px-3 py-1.5 bg-blue-600 text-white rounded-md ${fontStyles.button} hover:bg-blue-700`}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const DropdownNotification = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettings>(
    () => {
      // Try to load from localStorage if available
      if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('notification_settings');
        if (savedSettings) {
          try {
            return JSON.parse(savedSettings);
          } catch (e) {
            // If parsing fails, use default
          }
        }
      }
      return DEFAULT_SETTINGS;
    }
  );

  useEffect(() => {
    if (settings.autoRefresh) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, settings.refreshInterval * 1000);
      return () => clearInterval(interval);
    } else {
      fetchNotifications();
    }
  }, [settings.autoRefresh, settings.refreshInterval]);
  
  useEffect(() => {
    // Save settings to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_settings', JSON.stringify(settings));
    }
  }, [settings]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      const response = await fetch("http://192.168.4.150:8080/api/v1/Notification", {
        headers: { Authorization: `Basic ${authToken}` },
      });

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      // Filter out notifications without noteData and sort by most recent
      const sortedNotifications = (data.list?.filter((n: NotificationData) => n.noteData) || [])
        .sort((a: NotificationData, b: NotificationData) => 
          new Date(b.noteData?.createdAt || 0).getTime() - 
          new Date(a.noteData?.createdAt || 0).getTime()
        );
      
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("[Notifications] Error:", error);
      setError("Failed to load notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;

      const response = await fetch(`http://192.168.4.150:8080/api/v1/Notification/${notificationId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Basic ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) throw new Error("Failed to mark notification as read");

      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("[Notifications] Error marking as read:", error);
    }
  };
  
  const markAllAsRead = async () => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) return;
      
      const unreadIds = unreadNotifications.map(n => n.id);
      
      const promises = unreadIds.map(id => 
        fetch(`http://192.168.4.150:8080/api/v1/Notification/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: true }),
        })
      );
      
      await Promise.all(promises);
      
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          unreadIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("[Notifications] Error marking all as read:", error);
    }
  };

  // Apply filters and search to notifications
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    // Apply type filters based on settings
    filtered = filtered.filter(notification => {
      const type = notification.noteData?.type?.toLowerCase() as NotificationType;
      // If type is undefined or not in our settings, show it only if 'all' is enabled
      if (!type || !settings.showTypes[type]) {
        return settings.showTypes.all;
      }
      return settings.showTypes[type];
    });
    
    // Apply read/unread filter
    if (filterType === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (filterType === 'unread') {
      filtered = filtered.filter(n => !n.read);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n => 
        n.noteData?.createdByName?.toLowerCase().includes(query) ||
        n.noteData?.parentName?.toLowerCase().includes(query) ||
        getNotificationDetails(n).toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortType === 'oldest') {
      filtered.sort((a, b) => 
        new Date(a.noteData?.createdAt || 0).getTime() - 
        new Date(b.noteData?.createdAt || 0).getTime()
      );
    }
    // 'newest' is the default sort which is already applied
    
    return filtered;
  }, [notifications, filterType, sortType, searchQuery, settings.showTypes]);

  // Paginate the filtered results
  const paginatedNotifications = useMemo(() => {
    const itemsPerPage = settings.maxItems;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredNotifications, currentPage, settings.maxItems]);

  const totalPages = Math.ceil(filteredNotifications.length / settings.maxItems);
  const unreadNotifications = notifications.filter(n => !n.read);

  // Function to render a single notification
  const renderNotification = (notification: NotificationData) => {
    const Icon = getNotificationIcon(notification);
    const iconColor = getNotificationIconColor(notification);
    const priorityClass = getPriorityClass(notification);
    const link = getNotificationLink(notification);
    const enhancedDetails = getEnhancedNotificationDetails(notification);
    
    // Get entity type info
    const entityType = notification.relatedParentType || notification.noteData?.parentType;
    const entityInfo = getEntityTypeInfo(entityType);

    // Determine style based on notification data
    let notificationStyle = '';
    if (notification.noteData?.data?.style && styleColorMapping[notification.noteData.data.style as keyof typeof styleColorMapping]) {
      const style = styleColorMapping[notification.noteData.data.style as keyof typeof styleColorMapping];
      notificationStyle = `${style.bgColor} ${style.borderColor}`;
    }

    const genderIcon = notification.noteData?.createdByGender 
      ? (notification.noteData.createdByGender.toLowerCase() === 'female' 
        ? faFemale 
        : faMale) 
      : faUser;

    return (
      <div 
        key={notification.id} 
        className={`p-4 border-b border-gray-100 flex items-start gap-3 hover:bg-gray-50 transition-colors group cursor-pointer ${
          !notification.read ? 'bg-blue-50' : notificationStyle
        } ${priorityClass}`}
        onClick={() => markAsRead(notification.id)}
      >
        <div className="flex-shrink-0">
          <FontAwesomeIcon 
            icon={Icon} 
            className={`text-lg ${iconColor}`} 
          />
        </div>
        <div className="flex-grow">
          {enhancedDetails.hasStatusChange ? (
            <div>
              <div className="flex flex-col mb-1">
                <p className={`text-sm ${fontStyles.body} ${!notification.read ? 'font-semibold' : ''}`}>
                  {enhancedDetails.text}:
                </p>
                <div className="flex items-center gap-2">
                  {enhancedDetails.parentName && (
                    <p className={`text-sm font-medium text-gray-800`}>
                      {enhancedDetails.parentName}
                    </p>
                  )}
                  {entityInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${entityInfo.bgColor} ${entityInfo.color}`}>
                      {entityInfo.text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center mt-1.5 gap-2">
                {enhancedDetails.oldStatus && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${enhancedDetails.oldStatus.bgColor} ${enhancedDetails.oldStatus.color}`}>
                    {enhancedDetails.oldStatus.text}
                  </span>
                )}
                {enhancedDetails.oldStatus && enhancedDetails.newStatus && (
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs text-gray-500" />
                )}
                {enhancedDetails.newStatus && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${enhancedDetails.newStatus.bgColor} ${enhancedDetails.newStatus.color}`}>
                    {enhancedDetails.newStatus.text}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-sm ${fontStyles.body} ${!notification.read ? 'font-semibold' : ''}`}>
                {enhancedDetails.text}
              </p>
              {entityInfo && (
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${entityInfo.bgColor} ${entityInfo.color}`}>
                  {entityInfo.text}
                </span>
              )}
            </div>
          )}
          
          {link && (
            <a 
              href={link.url} 
              className={`text-xs ${fontStyles.link} block mt-2`}
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering the parent onClick
                markAsRead(notification.id);
              }}
            >
              View Details
            </a>
          )}
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center">
              <FontAwesomeIcon icon={genderIcon} className="text-xs text-gray-400 mr-1" />
              <p className={fontStyles.small}>
                {notification.noteData?.createdByName || 'Unknown user'}
              </p>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon icon={faClock} className="text-xs text-gray-400 mr-1" />
              <span className={fontStyles.small} title={new Date(notification.noteData?.createdAt || "").toLocaleString("el-GR")}>
                {formatTimeAgo(notification.noteData?.createdAt)}
              </span>
            </div>
          </div>
        </div>
        {!notification.read && (
          <div className="flex-shrink-0 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <FontAwesomeIcon 
              icon={faArrowRight} 
              className="text-blue-600 text-sm" 
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative inline-block">
      <ClickOutside onClick={() => setDropdownOpen(false)} className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="relative p-2.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center"
          aria-label="Notifications"
        >
          <FontAwesomeIcon 
            icon={faBell} 
            className={`text-xl ${
              unreadNotifications.length > 0 
                ? 'text-blue-600' 
                : 'text-gray-400'
            } transform transition-transform duration-200 hover:scale-110`}
          />
          {unreadNotifications.length > 0 && (
            <NotificationBadge count={unreadNotifications.length} />
          )}
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-[450px] bg-aspro rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
            {showSettings ? (
              <SettingsPanel 
                settings={settings} 
                onSettingsChange={setSettings}
                onClose={() => setShowSettings(false)}
              />
            ) : (
              <>
                <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">Notifications</span>
                    {loading && (
                      <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    )}
                  </h3>
                  <div className="flex items-center space-x-3">
                    {unreadNotifications.length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        aria-label="Mark all as read"
                      >
                        Mark all read
                      </button>
                    )}
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="Notification settings"
                    >
                      <FontAwesomeIcon icon={faCog} />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-aspro border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <FontAwesomeIcon 
                        icon={faSearch} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowFilterOptions(!showFilterOptions);
                          setShowSortOptions(false);
                        }}
                        className="p-2 text-sm text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md"
                        aria-label="Filter notifications"
                      >
                        <FontAwesomeIcon icon={faFilter} />
                      </button>
                      
                      {showFilterOptions && (
                        <div className="absolute right-0 mt-1 w-40 bg-aspro border border-gray-200 rounded-md shadow-md z-10">
                          <ul className="py-1">
                            <li>
                              <button
                                onClick={() => {
                                  setFilterType('all');
                                  setShowFilterOptions(false);
                                }}
                                className={`flex items-center justify-between px-4 py-2 text-sm w-full text-left ${filterType === 'all' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                              >
                                <span className={fontStyles.body}>All</span>
                                {filterType === 'all' && <FontAwesomeIcon icon={faCheck} className="text-blue-600" />}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  setFilterType('unread');
                                  setShowFilterOptions(false);
                                }}
                                className={`flex items-center justify-between px-4 py-2 text-sm w-full text-left ${filterType === 'unread' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                              >
                                <span className={fontStyles.body}>Unread</span>
                                {filterType === 'unread' && <FontAwesomeIcon icon={faCheck} className="text-blue-600" />}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  setFilterType('read');
                                  setShowFilterOptions(false);
                                }}
                                className={`flex items-center justify-between px-4 py-2 text-sm w-full text-left ${filterType === 'read' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                              >
                                <span>Read</span>
                                {filterType === 'read' && <FontAwesomeIcon icon={faCheck} className="text-blue-600" />}
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => {
                          setShowSortOptions(!showSortOptions);
                          setShowFilterOptions(false);
                        }}
                        className="p-2 text-sm text-gray-600 hover:text-blue-600 border border-gray-300 rounded-md"
                        aria-label="Sort notifications"
                      >
                        <FontAwesomeIcon icon={faSort} />
                      </button>
                      
                      {showSortOptions && (
                        <div className="absolute right-0 mt-1 w-40 bg-aspro border border-gray-200 rounded-md shadow-md z-10">
                          <ul className="py-1">
                            <li>
                              <button
                                onClick={() => {
                                  setSortType('newest');
                                  setShowSortOptions(false);
                                }}
                                className={`flex items-center justify-between px-4 py-2 text-sm w-full text-left ${sortType === 'newest' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                              >
                                <span>Newest first</span>
                                {sortType === 'newest' && <FontAwesomeIcon icon={faCheck} className="text-blue-600" />}
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => {
                                  setSortType('oldest');
                                  setShowSortOptions(false);
                                }}
                                className={`flex items-center justify-between px-4 py-2 text-sm w-full text-left ${sortType === 'oldest' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'}`}
                              >
                                <span>Oldest first</span>
                                {sortType === 'oldest' && <FontAwesomeIcon icon={faCheck} className="text-blue-600" />}
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {filterType !== 'all' && (
                    <div className="mt-2 flex">
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                        <span className="mr-1">
                          {filterType === 'read' ? 'Read only' : 'Unread only'}
                        </span>
                        <button 
                          onClick={() => setFilterType('all')}
                          className="text-blue-700 hover:text-blue-900"
                          aria-label="Remove filter"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto">
                  {error && (
                    <div className="p-4 bg-red-50 border-b border-red-100 text-sm text-red-600 flex items-center">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                      <span className={fontStyles.body}>{error}</span>
                    </div>
                  )}
                  
                  {paginatedNotifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <FontAwesomeIcon icon={faBell} className="text-3xl mb-2 text-gray-300" />
                      <p className={fontStyles.body}>{filteredNotifications.length === 0 && notifications.length > 0 
                        ? "No notifications match your filter"
                        : "No notifications"}
                      </p>
                    </div>
                  ) : (
                    paginatedNotifications.map(notification => renderNotification(notification))
                  )}
                </div>

                {filteredNotifications.length > settings.maxItems && (
                  <div className="p-3 flex justify-center items-center border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-1 rounded ${
                          currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        aria-label="Previous page"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      
                      <span className="text-xs text-gray-600 px-2">
                        {`Page ${currentPage} of ${totalPages}`}
                      </span>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded ${
                          currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        aria-label="Next page"
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </ClickOutside>
    </div>
  );
};

export default DropdownNotification;