"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { TileLayer, Marker, MapContainerProps, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { warehouseService } from "@/services/warehouseService";
import { 
  Package, PackageOpen, AlertTriangle, CheckCircle, BarChart2, 
  FileDown, PlusCircle, Upload, TrendingUp, TrendingDown, X,
  Eye, EyeOff, Save, RotateCcw, Settings, GripVertical, Maximize, Minimize,
  AlertCircle, ChevronDown, ChevronUp, Filter, Database, Info,
  Activity, Bell, Calendar, Clock, Command, Construction, FileSpreadsheet, 
  Map, MessageSquare, Moon, RefreshCw, Search, Shovel, Sun, PenToolIcon as Tool, 
  User, Users, Tag, FileText,
  LucideIcon,
  LocateFixed
} from "lucide-react";
import { ApexOptions } from "apexcharts";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, addDays, startOfDay } from "date-fns";
import { el } from "date-fns/locale";
import { useMonthlyStats } from '@/hooks/useMonthlyStats';
import { useYearlyStats } from '@/hooks/useYearlyStats';
import dynamic from 'next/dynamic';
import { useJobLocations } from '@/hooks/useJobLocations';



// Ελληνικές μεταφράσεις
const GREEK_TRANSLATIONS = {
  widgets: {
    soilWorkJobs: "Εργασίες Χωματουργικών",
    constructionJobs: "Εργασίες Κατασκευών",
    splicingJobs: "Εργασίες Συνδέσεων",
    completedJobs: "Ολοκληρωμένες Εργασίες",
    jobAnalytics: "Αναλυτικά Στοιχεία Εργασιών",
    postMortemAnalysis: "Ανάλυση Αποτελεσμάτων",
    upcomingJobs: "Προσεχείς Εργασίες",
    vehicleTracking: "Παρακολούθηση Οχημάτων",
    systemTime: "Ώρα Συστήματος",
    recentActivity: "Πρόσφατη Δραστηριότητα",
    projectStats: "Στατιστικά Έργου Pilot"
  },
  tabs: {
    locations: "Τοποθεσίες",
    technicians: "Τεχνικοί",
  },
  status: {
    active: "Ενεργός",
    issue: "Πρόβλημα",
    operational: "Λειτουργικός",
    maintenance: "Σε συντήρηση",
    scheduled: "Προγραμματισμένο",
    pendingApproval: "Σε αναμονή έγκρισης",
    delayed: "Καθυστερημένο"
  },
  jobTypes: {
    soilWork: "Χωματουργικά",
    construction: "Κατασκευή",
    splicing: "Σύνδεση",
    qualityInspection: "Έλεγχος Ποιότητας"
  },
  charts: {
    soilAnalysisAccuracy: "Ακρίβεια Ανάλυσης Εδάφους",
    constructionQuality: "Ποιότητα Κατασκευής",
    splicingPrecision: "Ακρίβεια Συνδέσεων",
    lastInspection: "Τελευταίος Έλεγχος",
    overallQuality: "Συνολική Ποιότητα",
    month: "Μήνας",
    completed: "Ολοκληρωμένα",
    hoursAgo: "ώρες πριν"
  },
  dashboard: {
    customize: "Προσαρμογή",
    done: "Ολοκληρώθηκε",
    reset: "Επαναφορά",
    save: "Αποθήκευση",
    hidden: "Κρυμμένα",
    systemTime: "ΩΡΑ ΣΥΣΤΗΜΑΤΟΣ",
    activeJobs: "Ενεργές Εργασίες",
    technicians: "Τεχνικοί",
    active: "Ενεργοί",
    ofJobs: "των εργασιών",
    projectCompletion: "Ολοκλήρωση Έργου",
    total: "Σύνολο",
    change: "Μεταβολή"
  },
  headers: {
    location: "Τοποθεσία",
    soilWork: "Χωματουργικά",
    construction: "Κατασκευή",
    splicing: "Σύνδεση",
    completed: "Ολοκληρωμένα",
    progress: "Πρόοδος",
    id: "ID",
    name: "Όνομα",
    role: "Ρόλος",
    activeJobs: "Ενεργές Εργασίες",
    efficiency: "Απόδοση",
    status: "Κατάσταση"
  },
  equipment: {
    inUse: "σε χρήση",
    inMaintenance: "σε συντήρηση",
    utilization: "χρησιμοποίηση",
    total: "σύνολο",
    units: "μονάδες"
  },
  actions: {
    tomorrow: "Αύριο",
    users: "Τεχνικοί",
    testing: "Εξοπλισμός Ελέγχου"
  },
  dashboardControls: "Ρυθμίσεις Πίνακα"
};

// Type definitions to fix TypeScript errors
interface TaskItem {
  status: string;
  addressCity?: string;
  createdAt?: string;
  dateStart?: string;
  sr?: string;
  length?: number;
  user?: string;
  assignedTo?: string;
  createdBy?: string;
}

interface Vehicle {
  id: string;
  lat: number;
  lng: number;
}

interface Product {
  id?: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
}

interface ProductFormData {
  name: string;
  sku: string;
  category: string;
  quantity: number;
}

interface DashboardData {
  autopsies: TaskItem[];
  earthwork: TaskItem[];
  splicing: TaskItem[];
  lastDrop: TaskItem[];
  liveTracking: Vehicle[];
  warehouse: Product[];
}

interface StatsData {
  totalTasks: number;
  completedTasks: number;
  splicesDone: number;
  earthworkKm: number;
}

// Νέα διεπαφή για τις εκδηλώσεις
interface Event {
  id: string;
  name: string;
  start: Date;
  end: Date;
  technicianName: string;
  technicianId?: string;
  type?: string;
  sr?: string;
  srText?: string;
  testRecordId?: string;
  appointmentType?: string;
  area?: string;
  details?: string;
  status?: string;
  rowPosition?: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  }
}

// Widget configuration interface
interface WidgetConfig {
  id: string;
  title: string;
  visible: boolean;
  defaultX?: number;
  defaultY?: number;
  defaultW?: number;
  defaultH?: number;
  minW?: number;
  minH?: number;
  userFiltered?: boolean; // Whether this widget supports user filtering
  apiSourcesSupported?: string[]; // API sources this widget can display
  selectedApiSource?: string; // Currently selected API source
}

// User filtering interface
interface UserFilter {
  enabled: boolean;
  userId: string | null;
}

// Status filtering interface
interface StatusFilter {
  enabled: boolean;
  statuses: Record<string, boolean>; // Map of status to whether it's selected
}

// Alert interface
interface Alert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

// Location data interface
interface LocationData {
  area: string;
  soilWork: number;
  construction: number;
  splicing: number;
  completed: number;
  progress: number;
}

// Technician data interface
interface TechnicianData {
  id: string;
  name: string;
  role: string;
  jobs: number;
  efficiency: number;
  status: string;
}

// Equipment data interface
interface EquipmentData {
  name: string;
  total: number;
  inUse: number;
  maintenance: number;
  status: string;
}

// Timeline event interface
interface TimelineEvent {
  time: string;
  event: string;
  technician: string;
  type: string;
}

// Job Schedule interface
interface ScheduledJobData {
  area: string;
  jobType: string;
  date: string;
  technicians: number;
  equipment: string;
  status: string;
}

// Monthly Data interface
interface MonthlyData {
  [month: string]: {
    soil: number;
    construction: number;
    splicing: number;
    completed: number;
  };
}

interface NoteApiResponse {
  id: string;
  post?: string | null;
  type?: string;
  createdAt: string;
  createdByName?: string;
  parentType?: string;
  parentName?: string;
  data?: any;
}


// Dynamic imports with proper typing
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const MapContainer = dynamic<MapContainerProps>(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });

// API Configuration - Centralized for easier maintenance
const API_CONFIG: Record<string, { url: string; key: string }> = {
  AUTOPSIES: { url: "http://192.168.4.150:8080/api/v1/Aytopsies1", key: "autopsies" },
  EARTHWORK: { url: "http://192.168.4.150:8080/api/v1/CChomatourgika", key: "earthwork" },
  SPLICING: { url: "http://192.168.4.150:8080/api/v1/CSplicingWork", key: "splicing" },
  LAST_DROP: { url: "http://192.168.4.150:8080/api/v1/KataskeyesFTTH", key: "lastDrop" },
  LIVE_TRACKING: { url: "/api/proxy/tracking", key: "liveTracking" },
  WAREHOUSE: { url: "/api/warehouse/products", key: "warehouse" },
};

// Endpoints για τα προσεχή γεγονότα όπως στην καλεντάρ κομπονεντ
const CONSTRUCTION_API_ENDPOINTS = [
  'http://192.168.4.150:8080/api/v1/Test',
  'http://192.168.4.150:8080/api/v1/CSplicingWork',
  'http://192.168.4.150:8080/api/v1/CKataskeyastikadates',
  'http://192.168.4.150:8080/api/v1/CEarthWork'
];

// Safe storage utility functions to prevent quota errors
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },
  
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }
};

// Default widgets configuration - Αφαιρούμε τα quickActions και qualityControl
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "soilWorkJobs", title: GREEK_TRANSLATIONS.widgets.soilWorkJobs, visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { id: "constructionJobs", title: GREEK_TRANSLATIONS.widgets.constructionJobs, visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { id: "splicingJobs", title: GREEK_TRANSLATIONS.widgets.splicingJobs, visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { id: "completedJobs", title: GREEK_TRANSLATIONS.widgets.completedJobs, visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { 
    id: "jobAnalytics", 
    title: GREEK_TRANSLATIONS.widgets.jobAnalytics, 
    visible: true, 
    defaultW: 8, 
    defaultH: 4, 
    minH: 4, 
    userFiltered: true,
    apiSourcesSupported: ["all", "autopsies", "earthwork", "splicing", "lastDrop"],
    selectedApiSource: "all"
  },
  { 
    id: "postMortemAnalysis", 
    title: GREEK_TRANSLATIONS.widgets.postMortemAnalysis, 
    visible: true, 
    defaultW: 4, 
    defaultH: 3, 
    minH: 3, 
    userFiltered: true,
    apiSourcesSupported: ["all", "autopsies", "earthwork", "splicing", "lastDrop"],
    selectedApiSource: "all"
  },
  { id: "jobSchedule", title: GREEK_TRANSLATIONS.widgets.upcomingJobs, visible: true, defaultW: 7, defaultH: 3, minH: 3, userFiltered: true },
  { id: "vehicleTracking", title: GREEK_TRANSLATIONS.widgets.vehicleTracking, visible: true, defaultW: 4, defaultH: 3, minH: 3, userFiltered: false },
  { id: "systemTime", title: GREEK_TRANSLATIONS.widgets.systemTime, visible: true, defaultW: 3, defaultH: 2, userFiltered: false },
  { id: "recentActivity", title: GREEK_TRANSLATIONS.widgets.recentActivity, visible: true, defaultW: 3, defaultH: 4, userFiltered: true },
  { id: "projectStats", title: GREEK_TRANSLATIONS.widgets.projectStats, visible: true, defaultW: 3, defaultH: 3, userFiltered: true }
];

// Event style mapping with proper typing
const EVENT_STYLES: Record<string, string> = {
  'ΟΛΟΚΛΗΡΩΣΗ': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  'ΑΠΟΣΤΟΛΗ': 'bg-blue-50 border-blue-200 text-blue-700',
  'ΑΠΟΡΡΙΨΗ': 'bg-yellow-50 border-yellow-200 text-yellow-700',
  'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': 'bg-red-50 border-red-200 text-red-700',
  'default': 'bg-gray-50 border-gray-200 text-gray-700'
};

// Helper function to get event style
const getEventStyle = (status?: string): string => {
  return EVENT_STYLES[status || 'default'] || EVENT_STYLES.default;
};

// Custom Alert Component with animations
const Alert: React.FC<{
  alert: Alert;
  onClose: (id: string) => void;
}> = ({ alert, onClose }) => {
  const colors = {
    success: "bg-green-100 text-green-800 border-green-300",
    error: "bg-red-100 text-red-800 border-red-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    info: "bg-blue-100 text-blue-800 border-blue-300"
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  useEffect(() => {
    if (alert.duration) {
      const timer = setTimeout(() => {
        onClose(alert.id);
      }, alert.duration);
      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  return (
    <div 
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-md mb-3 animate-slideIn ${colors[alert.type]}`}
      style={{animation: "slideIn 0.3s ease-out forwards"}}
    >
      {icons[alert.type]}
      <p className="flex-grow">{alert.message}</p>
      <button 
        onClick={() => onClose(alert.id)} 
        className="text-gray-500 hover:text-gray-700"
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Alert Container
const AlertContainer: React.FC<{
  alerts: Alert[];
  onClose: (id: string) => void;
}> = ({ alerts, onClose }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-full">
      {alerts.map(alert => (
        <Alert key={alert.id} alert={alert} onClose={onClose} />
      ))}
    </div>
  );
};

// Confirmation Dialog Component
const ConfirmDialog: React.FC<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = "Επιβεβαίωση", 
  cancelLabel = "Ακύρωση", 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 animate-fadeIn">
      <div className="bg-aspro rounded-lg shadow-xl w-full max-w-md p-6 animate-scaleIn">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// API Source Selector Component
const ApiSourceSelector: React.FC<{
  sources: string[];
  selectedSource: string;
  onChange: (source: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ sources, selectedSource, onChange, isOpen, onToggle }) => {
  // Map API keys to display names
  const getDisplayName = (key: string): string => {
    switch(key) {
      case 'all': return 'Όλες οι Πηγές';
      case 'autopsies': return 'Αυτοψίες';
      case 'earthwork': return 'Χωματουργικά';
      case 'splicing': return 'Συνδέσεις';
      case 'lastDrop': return 'Τελική Σύνδεση';
      default: return key.charAt(0).toUpperCase() + key.slice(1);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={onToggle}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
      >
        <Database size={14} />
        {getDisplayName(selectedSource)}
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-aspro rounded-md shadow-lg z-10 border border-gray-200 py-1 min-w-32">
          {sources.map(source => (
            <button
              key={source}
              onClick={() => {
                onChange(source);
                onToggle();
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${
                source === selectedSource 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              {getDisplayName(source)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Status Selection Component
const StatusSelector: React.FC<{
  availableStatuses: string[];
  selectedStatuses: Record<string, boolean>;
  onToggleStatus: (status: string) => void;
  enabled: boolean;
}> = ({ availableStatuses, selectedStatuses, onToggleStatus, enabled }) => {
  if (!enabled) return null;
  
  // Map status to display names and colors
  const getStatusDisplay = (status: string): { name: string; color: string } => {
    switch(status) {
      case 'ΟΛΟΚΛΗΡΩΣΗ': return { name: 'Ολοκληρωμένο', color: 'bg-green-100 text-green-800' };
      case 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': return { name: 'Μη Ολοκληρωμένο', color: 'bg-red-100 text-red-800' };
      case 'ΑΠΟΡΡΙΨΗ': return { name: 'Απορριφθέν', color: 'bg-yellow-100 text-yellow-800' };
      case 'ΝΕΟ': return { name: 'Νέο', color: 'bg-blue-100 text-blue-800' };
      default: return { name: status, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium">Φίλτρο ανά Κατάσταση:</span>
      <div className="flex flex-wrap gap-2">
        {availableStatuses.map(status => {
          const { name, color } = getStatusDisplay(status);
          const isSelected = selectedStatuses[status];
          
          return (
            <button
              key={status}
              onClick={() => onToggleStatus(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors 
                ${isSelected ? color : 'bg-gray-50 text-gray-400 border-gray-200'}`}
            >
              {name}
              {isSelected ? ' ✓' : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Component for nav items
const NavItem: React.FC<{ 
  icon: LucideIcon; 
  label: string; 
  active?: boolean 
}> = ({ icon: Icon, label, active }) => {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start ${active ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"}`}
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
};

// Component for status items
const StatusItem: React.FC<{ 
  label: string; 
  value: number; 
  max: number; 
  color: string 
}> = ({ label, value, max, color }) => {
  const percentage = Math.round((value / max) * 100);

  const getColor = (): string => {
    switch (color) {
      case "blue":
        return "from-blue-500 to-blue-600";
      case "green":
        return "from-green-500 to-green-600";
      case "purple":
        return "from-purple-500 to-purple-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-xs text-slate-500">
          {value}/{max}
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${getColor()} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// Job Stats Card Component (updated)
// Modified JobStatsCard component with loading spinner
const JobStatsCard: React.FC<{
  title: string;
  value: number | React.ReactNode;
  icon: LucideIcon;
  color: string;
  change: string;
  total: number;
  isLoading?: boolean;
}> = ({ title, value, icon: Icon, color, change, total, isLoading = false }) => {
  const getColor = (): string => {
    switch (color) {
      case "blue":
        return "border-blue-200 text-blue-600";
      case "indigo":
        return "border-indigo-200 text-indigo-600";
      case "purple":
        return "border-purple-200 text-purple-600";
      case "green":
        return "border-green-200 text-green-600";
      default:
        return "border-blue-200 text-blue-600";
    }
  };

  return (
    <Card className={`bg-aspro border ${getColor()} shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-slate-600">{title}</div>
          <Icon className={`h-5 w-5 ${getColor().split(" ")[1]}`} />
        </div>
        <div className="text-2xl font-bold mb-1 text-slate-900">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
              <span>...</span>
            </div>
          ) : value}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-green-600">{isLoading ? "" : change}</div>
          <div className="text-xs text-slate-500">{isLoading ? "-" : `${total} ${GREEK_TRANSLATIONS.dashboard.total}`}</div>
        </div>
      </CardContent>
    </Card>
  );
};

// Updated JobAnalyticsChart Component to use a line chart with wider dimensions
const JobAnalyticsChart: React.FC<{ 
  data: Record<string, {
    month: string;
    soil: number;
    construction: number;
    splicing: number;
    completed: number;
  }>;
  selectedMonth: string;
}> = ({ data, selectedMonth }) => {
  const months = Object.keys(data);
  
  // Find the index of the selected month
  const currentMonthIndex = months.indexOf(selectedMonth);
  
  // Get 6 months of data centered around the selected month for display
  const startIndex = Math.max(0, currentMonthIndex - 2);
  const endIndex = Math.min(months.length - 1, currentMonthIndex + 3);
  const displayMonths = months.slice(startIndex, endIndex + 1);
  
  // Prepare the data for ApexCharts
  const chartOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      // Remove the fixed width and use responsive options instead
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      background: '#f8fafc',
      // Add this to make the chart responsive
      redrawOnParentResize: true,
    },
    colors: ['#3b82f6', '#4f46e5', '#9333ea', '#22c55e'],
    stroke: {
      width: 3,
      curve: 'smooth',
    },
    xaxis: {
      categories: displayMonths,
      labels: {
        style: {
          colors: displayMonths.map(month => month === selectedMonth ? '#3b82f6' : '#94a3b8'),
          fontWeight: displayMonths.map(month => month === selectedMonth ? 700 : 400),
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#64748b',
        },
      },
    },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5,
      labels: {
        colors: '#64748b',
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (value) => `${value}`,
      },
    },
    markers: {
      size: 5,
      strokeWidth: 0,
      hover: {
        size: 7,
      },
    },
    dataLabels: {
      enabled: false,
    },
  };

  // Prepare the series data
  const series = [
    {
      name: 'Χωματουργικά',
      data: displayMonths.map(month => data[month].soil),
    },
    {
      name: 'Κατασκευή',
      data: displayMonths.map(month => data[month].construction),
    },
    {
      name: 'Συνδέσεις',
      data: displayMonths.map(month => data[month].splicing),
    },
    {
      name: 'Ολοκληρωμένα',
      data: displayMonths.map(month => data[month].completed),
    },
  ];

  return (
    <div className="relative h-full w-full">
      {/* Selected month details */}
      {selectedMonth && (
        <div className="absolute top-2 right-2 bg-aspro px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-xs z-10">
          <div className="font-medium text-center mb-1">{selectedMonth}</div>
          <div className="flex items-center text-blue-600">
            <div className="w-2 h-2 bg-blue-500 mr-1 rounded-full"></div>
            Χωματουργικά: {data[selectedMonth].soil}
          </div>
          <div className="flex items-center text-indigo-600">
            <div className="w-2 h-2 bg-indigo-500 mr-1 rounded-full"></div>
            Κατασκευή: {data[selectedMonth].construction}
          </div>
          <div className="flex items-center text-purple-600">
            <div className="w-2 h-2 bg-purple-500 mr-1 rounded-full"></div>
            Συνδέσεις: {data[selectedMonth].splicing}
          </div>
          <div className="flex items-center text-green-600 mt-1 pt-1 border-t">
            <div className="w-2 h-2 bg-green-500 mr-1 rounded-full"></div>
            Ολοκληρωμένα: {data[selectedMonth].completed}
          </div>
        </div>
      )}
      
      {/* ApexCharts Line Chart */}
      <ReactApexChart 
        options={chartOptions} 
        series={series} 
        type="line" 
        height="100%" 
        width="100%" 
      />
    </div>
  );
};

// Location Row Component
const LocationRow: React.FC<LocationData> = ({
  area,
  soilWork,
  construction,
  splicing,
  completed,
  progress,
}) => {
  return (
    <div className="grid grid-cols-12 py-2 px-3 text-sm hover:bg-slate-100">
      <div className="col-span-3 text-slate-900 font-medium">{area}</div>
      <div className="col-span-2 text-blue-600">{soilWork}</div>
      <div className="col-span-2 text-indigo-600">{construction}</div>
      <div className="col-span-2 text-purple-600">{splicing}</div>
      <div className="col-span-2 text-green-600">{completed}</div>
      <div className="col-span-1">
        <Progress value={progress} className="h-1.5 bg-slate-100">
          <div
            className={`h-full rounded-full ${
              progress > 90 ? "bg-green-500" : progress > 60 ? "bg-blue-500" : "bg-amber-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </Progress>
      </div>
    </div>
  );
};

// Technician Row Component
const TechnicianRow: React.FC<TechnicianData> = ({
  id,
  name,
  role,
  jobs,
  efficiency,
  status,
}) => {
  return (
    <div className="grid grid-cols-12 py-2 px-3 text-sm hover:bg-slate-100">
      <div className="col-span-1 text-slate-500">{id}</div>
      <div className="col-span-3 text-slate-900">{name}</div>
      <div className="col-span-3 text-slate-600">{role}</div>
      <div className="col-span-2 text-blue-600">{jobs}</div>
      <div className="col-span-2 text-purple-600">{efficiency}%</div>
      <div className="col-span-1">
        <Badge
          variant="outline"
          className={
            status === "active"
              ? "bg-green-50 text-green-600 border-green-200 text-xs"
              : "bg-amber-50 text-amber-600 border-amber-200 text-xs"
          }
        >
          {status === "active" ? GREEK_TRANSLATIONS.status.active : GREEK_TRANSLATIONS.status.issue}
        </Badge>
      </div>
    </div>
  );
};

// Equipment Item Component
const EquipmentItem: React.FC<EquipmentData> = ({
  name,
  total,
  inUse,
  maintenance,
  status,
}) => {
  const utilization = Math.round((inUse / total) * 100);

  return (
    <div className="bg-aspro rounded-md p-3 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-900 font-medium">{name}</div>
        <Badge
          variant="outline"
          className={
            status === "operational"
              ? "bg-green-50 text-green-600 border-green-200 text-xs"
              : "bg-amber-50 text-amber-600 border-amber-200 text-xs"
          }
        >
          {status === "operational" ? GREEK_TRANSLATIONS.status.operational : GREEK_TRANSLATIONS.status.maintenance}
        </Badge>
      </div>
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-slate-500">
            {inUse} {GREEK_TRANSLATIONS.equipment.inUse} / {maintenance} {GREEK_TRANSLATIONS.equipment.inMaintenance}
          </div>
          <div className="text-xs text-slate-600">{utilization}% {GREEK_TRANSLATIONS.equipment.utilization}</div>
        </div>
        <Progress value={utilization} className="h-1.5 bg-slate-100">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${utilization}%` }} />
        </Progress>
      </div>
      <div className="text-xs text-slate-500">{GREEK_TRANSLATIONS.equipment.total}: {total} {GREEK_TRANSLATIONS.equipment.units}</div>
    </div>
  );
};

// Scheduled Job Component
const ScheduledJob: React.FC<Event> = (event) => {
  const getJobTypeIcon = (type?: string): React.ReactNode => {
    switch (type) {
      case 'CONSTRUCTION':
        return <Tag className="h-5 w-5 mr-2 text-green-600" />;
      case 'SPLICING':
        return <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />;
      case 'EARTHWORK':
        return <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />;
      case 'AUTOPSY':
        return <FileText className="h-5 w-5 mr-2 text-purple-600" />;
      default:
        return <Calendar className="h-5 w-5 mr-2 text-slate-600" />;
    }
  };

  const getJobTypeName = (type?: string): string => {
    switch (type) {
      case 'CONSTRUCTION':
        return GREEK_TRANSLATIONS.jobTypes.construction;
      case 'SPLICING':
        return GREEK_TRANSLATIONS.jobTypes.splicing;
      case 'EARTHWORK':
        return GREEK_TRANSLATIONS.jobTypes.soilWork;
      case 'AUTOPSY':
        return GREEK_TRANSLATIONS.jobTypes.qualityInspection;
      default:
        return GREEK_TRANSLATIONS.jobTypes.construction;
    }
  };

  return (
    <div className="border border-slate-200 rounded-md p-3 hover:bg-slate-50">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-slate-900">{event.area || "Περιοχή"}</div>
        <Badge className={`${getEventStyle(event.status)}`}>
          {event.status || GREEK_TRANSLATIONS.status.scheduled}
        </Badge>
      </div>
      <div className="flex items-center text-sm mb-1">
        {getJobTypeIcon(event.appointmentType)}
        <span className={event.appointmentType === 'CONSTRUCTION' ? 'text-green-600' : 
                         event.appointmentType === 'SPLICING' ? 'text-blue-600' :
                         event.appointmentType === 'EARTHWORK' ? 'text-orange-600' : 'text-purple-600'}>
          {getJobTypeName(event.appointmentType)}
        </span>
      </div>
      <div className="text-xs text-slate-700 font-medium mb-1">{event.name}</div>
      <div className="text-xs text-slate-500 mb-2">
        <Clock className="inline-block h-3 w-3 mr-1" /> 
        {event.start && format(new Date(event.start), 'dd/MM/yyyy HH:mm')}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <div>
          <User className="inline-block h-3 w-3 mr-1" /> {event.technicianName || "Τεχνικός"}
        </div>
        {event.sr && (
          <div className="truncate max-w-[150px]" title={event.sr}>
            SR: {event.sr}
          </div>
        )}
      </div>
    </div>
  );
};

// Timeline Event Component
const TimelineEvent: React.FC<TimelineEvent> = ({
  time,
  event,
  technician,
  type,
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case "soil":
        return <Shovel className="h-4 w-4 text-blue-600" />;
      case "construction":
        return <Construction className="h-4 w-4 text-indigo-600" />;
      case "splicing":
        return <Tool className="h-4 w-4 text-purple-600" />;
      case "inspection":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "issue":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case "admin":
        return <FileSpreadsheet className="h-4 w-4 text-slate-600" />;
      case "report":
        return <FileSpreadsheet className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="absolute -left-6 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-600"></div>

      {/* Time */}
      <div className="text-sm font-medium text-blue-600 mb-1">{time}</div>

      {/* Event content */}
      <div className="bg-slate-50 rounded-md p-2 border border-slate-200">
        <div className="text-sm text-slate-900 mb-1">{event}</div>
        <div className="flex items-center justify-between text-xs">
          <div className="text-slate-500">
            <User className="inline-block h-3 w-3 mr-1" /> {technician}
          </div>
          <div className="flex items-center">{getTypeIcon()}</div>
        </div>
      </div>
    </div>
  );
};

// Widget Container Component (Enhanced for FTTH design)
const WidgetContainer: React.FC<{
  title: string;
  id: string;
  onToggleVisibility: (id: string) => void;
  isEditMode: boolean;
  userFiltered?: boolean;
  userFilterEnabled?: boolean;
  onToggleUserFilter?: (id: string) => void;
  apiSourcesSupported?: string[];
  selectedApiSource?: string;
  onChangeApiSource?: (id: string, source: string) => void;
  children: React.ReactNode;
}> = ({ 
  title, 
  id, 
  onToggleVisibility, 
  isEditMode, 
  userFiltered, 
  userFilterEnabled,
  onToggleUserFilter,
  apiSourcesSupported,
  selectedApiSource,
  onChangeApiSource,
  children 
}) => {
  const [isApiSourceOpen, setIsApiSourceOpen] = useState(false);

  const toggleApiSourceDropdown = () => {
    setIsApiSourceOpen(!isApiSourceOpen);
  };

  const handleApiSourceChange = (source: string) => {
    if (onChangeApiSource) {
      onChangeApiSource(id, source);
    }
  };

  return (
    <div className="bg-aspro rounded-lg shadow-md h-full flex flex-col">
      <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {apiSourcesSupported && apiSourcesSupported.length > 1 && selectedApiSource && (
            <ApiSourceSelector
              sources={apiSourcesSupported}
              selectedSource={selectedApiSource}
              onChange={(source) => handleApiSourceChange(source)}
              isOpen={isApiSourceOpen}
              onToggle={toggleApiSourceDropdown}
            />
          )}
          {isEditMode && userFiltered && (
            <button 
              onClick={() => onToggleUserFilter && onToggleUserFilter(id)} 
              className={`text-gray-500 hover:text-gray-700 ${userFilterEnabled ? 'text-blue-600' : ''}`}
              title={userFilterEnabled ? "Απενεργοποίηση φιλτραρίσματος χρήστη" : "Ενεργοποίηση φιλτραρίσματος χρήστη"}
            >
              <Filter size={18} />
            </button>
          )}
          {isEditMode && (
            <button 
              onClick={() => onToggleVisibility(id)} 
              className="text-gray-500 hover:text-gray-700"
              title="Απόκρυψη widget"
            >
              <EyeOff size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="p-4 flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

// User Selection Component
const UserSelector: React.FC<{
  users: string[];
  selectedUser: string | null;
  onSelectUser: (userId: string | null) => void;
  enabled: boolean;
}> = ({ users, selectedUser, onSelectUser, enabled }) => {
  if (!enabled) return null;
  
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium">Φίλτρο ανά Χρήστη:</label>
      <select 
        value={selectedUser || ''}
        onChange={(e) => onSelectUser(e.target.value || null)}
        className="border border-gray-300 rounded-lg p-1 text-sm"
      >
        <option value="">Όλοι οι Χρήστες</option>
        {users.map(user => (
          <option key={user} value={user}>{user}</option>
        ))}
      </select>
    </div>
  );
};

// Dashboard Control Panel Component
const DashboardControls: React.FC<{
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onSaveLayout: () => void;
  onResetLayout: () => void;
  onToggleHiddenPanel: () => void;
  hiddenWidgetsCount: number;
  userFilter: UserFilter;
  onUserFilterChange: (userId: string | null) => void;
  onToggleUserFiltering: () => void;
  availableUsers: string[];
  statusFilter: StatusFilter;
  onToggleStatusFiltering: () => void;
  onToggleStatus: (status: string) => void;
  availableStatuses: string[];
}> = ({ 
  isEditMode, 
  onToggleEditMode, 
  onSaveLayout, 
  onResetLayout, 
  onToggleHiddenPanel, 
  hiddenWidgetsCount,
  userFilter,
  onUserFilterChange,
  onToggleUserFiltering,
  availableUsers,
  statusFilter,
  onToggleStatusFiltering,
  onToggleStatus,
  availableStatuses
}) => {
  return (
    <div className="bg-aspro rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="text-blue-600" /> {GREEK_TRANSLATIONS.dashboardControls}
        </h2>
        <div className="flex gap-3">
          {hiddenWidgetsCount > 0 && (
            <button
              onClick={onToggleHiddenPanel}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Eye size={16} /> {GREEK_TRANSLATIONS.dashboard.hidden} ({hiddenWidgetsCount})
            </button>
          )}
          {isEditMode && (
            <button
              onClick={onToggleUserFiltering}
              className={`px-4 py-2 ${userFilter.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} rounded-lg hover:bg-gray-200 flex items-center gap-1`}
              title={userFilter.enabled ? "Απενεργοποίηση φιλτραρίσματος χρήστη" : "Ενεργοποίηση φιλτραρίσματος χρήστη"}
            >
              <Filter size={16} /> Φίλτρο Χρήστη {userFilter.enabled ? 'Ενεργό' : 'Ανενεργό'}
            </button>
          )}
          {isEditMode && (
            <button
              onClick={onToggleStatusFiltering}
              className={`px-4 py-2 ${statusFilter.enabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} rounded-lg hover:bg-gray-200 flex items-center gap-1`}
              title={statusFilter.enabled ? "Απενεργοποίηση φιλτραρίσματος κατάστασης" : "Ενεργοποίηση φιλτραρίσματος κατάστασης"}
            >
              <CheckCircle size={16} /> Φίλτρο Κατάστασης {statusFilter.enabled ? 'Ενεργό' : 'Ανενεργό'}
            </button>
          )}
          <button
            onClick={onResetLayout}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <RotateCcw size={16} /> {GREEK_TRANSLATIONS.dashboard.reset}
          </button>
          {isEditMode && (
            <button
              onClick={onSaveLayout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Save size={16} /> {GREEK_TRANSLATIONS.dashboard.save}
            </button>
          )}
          <button
            onClick={onToggleEditMode}
            className={`px-4 py-2 rounded-lg flex items-center gap-1 ${
              isEditMode
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {isEditMode ? (
              <>
                <CheckCircle size={16} /> {GREEK_TRANSLATIONS.dashboard.done}
              </>
            ) : (
              <>
                <Settings size={16} /> {GREEK_TRANSLATIONS.dashboard.customize}
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="space-y-3 mt-4">
        {/* User filters */}
        <UserSelector 
          users={availableUsers}
          selectedUser={userFilter.userId}
          onSelectUser={onUserFilterChange}
          enabled={userFilter.enabled}
        />
        
        {/* Status filters */}
        <StatusSelector 
          availableStatuses={availableStatuses}
          selectedStatuses={statusFilter.statuses}
          onToggleStatus={onToggleStatus}
          enabled={statusFilter.enabled}
        />
      </div>
    </div>
  );
};

// Hidden Widgets Panel Component
const HiddenWidgetsPanel: React.FC<{
  hiddenWidgets: WidgetConfig[];
  onShowWidget: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ hiddenWidgets, onShowWidget, isOpen, onToggle }) => {
  if (!isOpen || hiddenWidgets.length === 0) return null;

  return (
    <div className="bg-aspro rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Κρυμμένα Widgets</h2>
        <button onClick={onToggle} className="text-gray-500"><X size={20} /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {hiddenWidgets.map(widget => (
          <div 
            key={widget.id} 
            className="border rounded-lg p-3 flex justify-between items-center"
          >
            <span>{widget.title}</span>
            <button 
              onClick={() => onShowWidget(widget.id)} 
              className="text-blue-600 hover:text-blue-800"
              title="Εμφάνιση widget"
            >
              <Eye size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

// Error Display Component
const ErrorDisplay: React.FC<{ 
  message: string 
}> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
    <div className="text-red-600 mb-4">
      <AlertTriangle size={48} />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Σφάλμα Φόρτωσης Πίνακα</h2>
    <p className="text-gray-600 mb-6">{message}</p>
    <button 
      onClick={() => window.location.reload()} 
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Δοκιμάστε Ξανά
    </button>
  </div>
);

const DashboardMap = dynamic(
  () => import('@/components/map/DashboardMap'), 
  { 
    ssr: false,
    loading: () => (
      <div style={{ height: '250px', width: '100%' }} className="bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }
);

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [data, setData] = useState<Partial<DashboardData>>({});
  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("User");
  
  // Add these new state declarations here
  const { jobLocations, loading: locationsLoading, error: locationsError } = useJobLocations();

  // Continue with other existing states...
  const monthlyStats = useMonthlyStats();
  const yearlyStats = useYearlyStats();
  
  // Dashboard customization state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [widgetsConfig, setWidgetsConfig] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [showHiddenPanel, setShowHiddenPanel] = useState<boolean>(false);
  const [userFilter, setUserFilter] = useState<UserFilter>({ enabled: false, userId: null });
  const [widgetUserFilters, setWidgetUserFilters] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>({ 
    enabled: false, 
    statuses: {
      'ΟΛΟΚΛΗΡΩΣΗ': true,
      'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': true,
      'ΑΠΟΡΡΙΨΗ': true,
      'ΝΕΟ': true
    }
  });

  // State for FTTH Dashboard
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString('el-GR', { month: 'short' })
  );
  const [selectedTab, setSelectedTab] = useState<string>("locations");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // UI state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Σταθερές τιμές για τις εργασίες (αντί για τυχαίες)
  const [soilWorkJobs, setSoilWorkJobs] = useState(42);
  const [constructionJobs, setConstructionJobs] = useState(108);
  const [splicingJobs, setSplicingJobs] = useState(76);
  const [completedJobs, setCompletedJobs] = useState(114);
  const [activeTechnicians, setActiveTechnicians] = useState(32);
  const [recentEvents, setRecentEvents] = useState<TimelineEvent[]>([]);
  
  // State για προσεχείς εργασίες
  const [upcomingJobs, setUpcomingJobs] = useState<Event[]>([]);
  
  // Alert and confirmation handlers
  const showAlert = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string, duration: number = 3000) => {
    const id = Date.now().toString();
    setAlerts(prev => [...prev, { id, type, message, duration }]);
  }, []);

  const closeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  }, []);

  const showConfirmDialog = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  }, []);
  
  // Memoized derived data to prevent recalculations
  const allTasks = useMemo<TaskItem[]>(() => {
    const tasks = [
      ...(data.autopsies || []),
      ...(data.earthwork || []),
      ...(data.splicing || []),
      ...(data.lastDrop || []),
    ];
    
    // Global filtering is not applied here - it's applied per widget
    return tasks;
  }, [data]);

  // Extract all unique statuses from the data
  const availableStatuses = useMemo<string[]>(() => {
    const statuses = new Set<string>();
    
    // Extract statuses from all task types
    const addStatusesFromTasks = (tasks: TaskItem[]) => {
      tasks.forEach(task => {
        if (task?.status) {
          statuses.add(task.status);
        }
      });
    };
    
    // Add users from all task types
    if (data.autopsies) addStatusesFromTasks(data.autopsies);
    if (data.earthwork) addStatusesFromTasks(data.earthwork);
    if (data.splicing) addStatusesFromTasks(data.splicing);
    if (data.lastDrop) addStatusesFromTasks(data.lastDrop);
    
    // Ensure our predefined statuses are included
    ['ΟΛΟΚΛΗΡΩΣΗ', 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ', 'ΑΠΟΡΡΙΨΗ', 'ΝΕΟ'].forEach(status => {
      statuses.add(status);
    });
    
    // Convert to array and sort
    return Array.from(statuses).sort();
  }, [data]);

  // Function to filter tasks by the selected statuses
  const filterTasksByStatus = useCallback((tasks: TaskItem[]) => {
    if (!statusFilter.enabled) return tasks;
    
    return tasks.filter(task => {
      const status = task?.status;
      if (!status) return false;
      return statusFilter.statuses[status] === true;
    });
  }, [statusFilter]);

  // Get tasks based on selected API source
  const getTasksByApiSource = useCallback((widgetId: string) => {
    // Find the widget configuration
    const widget = widgetsConfig.find(w => w.id === widgetId);
    
    // If no specific API source is selected or not supported, return all tasks
    if (!widget || !widget.selectedApiSource || widget.selectedApiSource === 'all') {
      return statusFilter.enabled ? filterTasksByStatus(allTasks) : allTasks;
    }
    
    // Return tasks from the selected API source
    let sourceTasks: TaskItem[] = [];
    switch (widget.selectedApiSource) {
      case 'autopsies':
        sourceTasks = data.autopsies || [];
        break;
      case 'earthwork':
        sourceTasks = data.earthwork || [];
        break;
      case 'splicing':
        sourceTasks = data.splicing || [];
        break;
      case 'lastDrop':
        sourceTasks = data.lastDrop || [];
        break;
      default:
        sourceTasks = allTasks;
    }
    
    return statusFilter.enabled ? filterTasksByStatus(sourceTasks) : sourceTasks;
  }, [widgetsConfig, allTasks, data, statusFilter, filterTasksByStatus]);

  // Filter tasks based on user selection
  const shouldFilterByUser = useCallback((widgetId: string): boolean => {
    return userFilter.enabled && 
           userFilter.userId !== null && 
           widgetUserFilters[widgetId] === true;
  }, [userFilter, widgetUserFilters]);

  // Function to filter tasks by the selected user
  const filterTasksByUser = useCallback((tasks: TaskItem[]): TaskItem[] => {
    if (!userFilter.enabled || !userFilter.userId) return tasks;
    
    return tasks.filter(task => {
      // Adjust these field names based on your actual data structure
      return (task?.user === userFilter.userId) || 
             (task?.assignedTo === userFilter.userId) || 
             (task?.createdBy === userFilter.userId);
    });
  }, [userFilter]);

  // Memoized stats to prevent recalculations
  const stats = useMemo<StatsData>(() => ({
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.status === "ΟΛΟΚΛΗΡΩΣΗ").length,
    splicesDone: (data.splicing || []).filter(s => s.status === "ΟΛΟΚΛΗΡΩΣΗ").length,
    earthworkKm: (data.earthwork || []).reduce((acc, e) => acc + (e?.length || 0), 0) / 1000,
  }), [allTasks, data.splicing, data.earthwork]);

  // Helper function to get appointment type from endpoint
  const getAppointmentTypeFromEndpoint = (endpoint: string): string => {
    switch (endpoint) {
      case 'CKataskeyastikadates':
        return 'CONSTRUCTION';
      case 'CSplicingWork':
        return 'SPLICING';
      case 'CEarthWork':
        return 'EARTHWORK';
      case 'Test':
        return 'AUTOPSY';
      default:
        return 'CONSTRUCTION';
    }
  };

  const fetchTimelineEvents = useCallback(async (): Promise<TimelineEvent[]> => {
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");
      
      // Fetch data from the Note API
      const response = await fetch("http://192.168.4.150:8080/api/v1/Note", {
        headers: {
          Authorization: `Basic ${authToken}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) throw new Error(`Failed to fetch from Note API: ${response.status}`);
      
      const data = await response.json();
      
      if (!data?.list || !Array.isArray(data.list)) {
        return [];
      }
      
      // Process and transform the data into TimelineEvent format
      return data.list
        .filter((note: NoteApiResponse) => note.createdAt && note.createdByName)
        .map((note: NoteApiResponse) => {
          // Determine event type based on parentType or type
          let eventType = "admin"; // Default type
          
          if (note.parentType) {
            if (note.parentType.includes("Chomatourgika") || note.parentType.includes("CEarthWork")) {
              eventType = "soil";
            } else if (note.parentType.includes("Kataskeyes") || note.parentType.includes("Construction")) {
              eventType = "construction";
            } else if (note.parentType.includes("Splicing")) {
              eventType = "splicing";
            } else if (note.parentType.includes("Test") || note.parentType.includes("Aytopsies")) {
              eventType = "inspection";
            }
          }
          
          // If the note has status data and it's an error or rejection
          if (note.data?.value === "ΜΗ ΟΛΟΚΛΗΡΩΣΗ" || note.data?.value === "ΑΠΟΡΡΙΨΗ") {
            eventType = "issue";
          }
          
          // Format time from createdAt
          const createdDate = new Date(note.createdAt);
          const time = createdDate.toLocaleTimeString("el-GR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          
          // Create event description
          let event = "";
          
          if (note.type === "Status" && note.data?.value) {
            if (note.data.value === "ΟΛΟΚΛΗΡΩΣΗ") {
              event = `Ολοκληρώθηκε η εργασία ${note.parentName || ""}`;
            } else if (note.data.value === "ΑΠΟΣΤΟΛΗ" || note.data.value === "ΠΡΟΓΡΑΜΜΑΤΙΣΜΕΝΟ") {
              event = `Προγραμματίστηκε εργασία ${note.parentName || ""}`;
            } else if (note.data.value === "ΑΠΟΡΡΙΨΗ" || note.data.value === "ΜΗ ΟΛΟΚΛΗΡΩΣΗ") {
              event = `Αναφέρθηκε πρόβλημα στην εργασία ${note.parentName || ""}`;
            } else {
              event = `Ενημέρωση κατάστασης εργασίας ${note.parentName || ""}: ${note.data.value}`;
            }
          } else if (note.type === "Post" && note.post) {
            event = `Σχόλιο σχετικά με ${note.parentName || ""}: ${note.post.substring(0, 50)}${note.post.length > 50 ? '...' : ''}`;
          } else if (note.type === "Update") {
            event = `Ενημέρωση στοιχείων για ${note.parentName || ""}`;
          } else {
            event = note.parentName || "Ενημέρωση συστήματος";
          }
          
          return {
            time,
            event,
            technician: note.createdByName || "Σύστημα",
            type: eventType,
          };
        })
        .sort((a, b) => {
          // Sort by time in descending order (most recent first)
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          
          // Compare hours
          if (timeB[0] !== timeA[0]) {
            return timeB[0] - timeA[0];
          }
          
          // If hours are equal, compare minutes
          return timeB[1] - timeA[1];
        })
        .slice(0, 5); // Get only the 5 most recent events
    } catch (error) {
      console.error("Error fetching timeline events:", error);
      return [];
    }
  }, []);
  
  // Function to update the timeline events
  const updateTimelineEvents = async () => {
    setLoading(true);
    try {
      const events = await fetchTimelineEvents();
      setRecentEvents(events);
    } catch (error) {
      console.error("Error updating timeline events:", error);
      showAlert('error', 'Αποτυχία ανάκτησης πρόσφατων συμβάντων', 3000);
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch upcoming events from the API endpoints
  const fetchUpcomingEvents = useCallback(async (): Promise<void> => {
    setLoadingUpcomingJobs(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("Authentication token not found");
      
      // Get current date in yyyy-MM-dd format
      const today = new Date();
      const formattedToday = format(today, 'yyyy-MM-dd');
      
      // Array to store all upcoming events
      const allEvents: Event[] = [];
      
      await Promise.all(CONSTRUCTION_API_ENDPOINTS.map(async (endpoint) => {
        const apiSource = endpoint.split('/').pop() || 'Unknown';
        
        try {
          const response = await fetch(`${endpoint}?date=${formattedToday}`, {
            headers: {
              Authorization: `Basic ${authToken}`,
              "Content-Type": "application/json",
            },
          });
          
          if (!response.ok) throw new Error(`Failed to fetch from ${endpoint}: ${response.status}`);
          
          const data = await response.json();
          
          if (data?.list && Array.isArray(data.list)) {
            // Filter for upcoming events (today and future)
            const events = data.list.filter((item: any) => {
              if (!item.dateStart || !item.assignedUserName) return false;
              
              const eventDate = new Date(item.dateStart);
              const todayStart = startOfDay(today);
              
              return eventDate >= todayStart;
            });
            
            // Map API data to Event type and add to allEvents
            events.forEach((item: any) => {
              const appointmentType = getAppointmentTypeFromEndpoint(apiSource);
              
              allEvents.push({
                id: item.id || String(Math.random()),
                name: item.name || apiSource,
                start: new Date(item.dateStart),
                end: new Date(item.dateEnd || addDays(new Date(item.dateStart), 1)),
                technicianName: item.assignedUserName,
                technicianId: item.assignedUser,
                status: item.status,
                sr: apiSource === 'Test' ? item.srText : item.sr,
                testRecordId: item.testRecordId,
                area: item.addressCity || item.perioxi || (item.name?.includes(" Δ. ") ? "Δ. " + item.name.split(" Δ. ")[1] : ""),
                details: item.details || item.description || item.info || item.sxolia,
                appointmentType,
                location: (item.addressLatitude && item.addressLongitude) || item.mapsurl ? {
                  latitude: parseFloat(item.addressLatitude || (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[0] : "0")),
                  longitude: parseFloat(item.addressLongitude || (item.mapsurl ? item.mapsurl.split("q=")[1]?.split(",")[1] : "0")),
                  address: item.addressStreet || item.address || item.name || ""
                } : undefined
              });
            });
          }
        } catch (error) {
          console.error(`Error fetching from ${endpoint}:`, error);
        }
      }));
      
      // Sort events by date (ascending)
      allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      
      setUpcomingJobs(allEvents);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    } finally {
      setLoadingUpcomingJobs(false);
    }
  }, []);

  // Status filtering handlers
  const handleToggleStatusFiltering = useCallback(() => {
    setStatusFilter(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
    
    // Show feedback when toggled
    showAlert(
      'info', 
      `Το φιλτράρισμα κατάστασης ${statusFilter.enabled ? 'απενεργοποιήθηκε' : 'ενεργοποιήθηκε'}`,
      2000
    );
  }, [statusFilter.enabled, showAlert]);
  
  const handleToggleStatus = useCallback((status: string) => {
    setStatusFilter(prev => ({
      ...prev,
      statuses: {
        ...prev.statuses,
        [status]: !prev.statuses[status]
      }
    }));
    
    // If all statuses become deselected, select all of them
    const allDeselected = Object.values({
      ...statusFilter.statuses,
      [status]: !statusFilter.statuses[status]
    }).every(selected => !selected);
    
    if (allDeselected) {
      setStatusFilter(prev => ({
        ...prev,
        statuses: Object.keys(prev.statuses).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>)
      }));
      showAlert('info', 'Όλες οι καταστάσεις επιλέχθηκαν - πρέπει να επιλέξετε τουλάχιστον μία κατάσταση', 2000);
    }
  }, [statusFilter.statuses, showAlert]);

  // Completion percentage with safe division
  const completionPercentage = useMemo(() => 
    stats.totalTasks > 0 
      ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) 
      : "0.0", 
    [stats.completedTasks, stats.totalTasks]
  );

  // Fetch data function with error handling
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const authToken = localStorage.getItem("auth_token");
    const newData: Partial<DashboardData> = {};

    try {
      // Use Promise.all to fetch data in parallel
      const responses = await Promise.all(
        Object.entries(API_CONFIG).map(async ([key, config]) => {
          try {
            const headers: Record<string, string> = {};
            
            // Add authorization header for protected endpoints
            if (key !== "LIVE_TRACKING" && key !== "WAREHOUSE") {
              headers.Authorization = `Basic ${authToken || ''}`;
            }
            
            const response = await fetch(config.url, { headers });
            
            if (!response.ok) {
              throw new Error(`Failed to fetch ${key}: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Process the data based on the endpoint
            let processedData: any[] = [];
            if (key === "LIVE_TRACKING") {
              processedData = result.data?.units || [];
            } else if (key === "WAREHOUSE") {
              processedData = result.products || [];
            } else {
              processedData = result.list || [];
            }
            
            return { key: config.key, data: processedData };
          } catch (err) {
            console.error(`Error fetching ${key}:`, err);
            return { key: config.key, data: [], error: err instanceof Error ? err.message : 'Unknown error' };
          }
        })
      );
      
      // Process successful responses
      responses.forEach(({ key, data: responseData }) => {
        newData[key as keyof DashboardData] = responseData as any;
      });
      
      setData(newData);
      setWarehouseProducts(newData.warehouse || []);
      
      // Extract job counts
      setSoilWorkJobs(newData.earthwork?.length || 42);
      setSplicingJobs(newData.splicing?.length || 76);
      setCompletedJobs(newData.lastDrop?.filter(item => item.status === "ΟΛΟΚΛΗΡΩΣΗ")?.length || 114);
      
      // Fetch upcoming events for jobSchedule widget
      fetchUpcomingEvents();
      
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Αποτυχία φόρτωσης δεδομένων πίνακα");
    } finally {
      setLoading(false);
    }
  }, [fetchUpcomingEvents]);

  // Extract all unique users from the data
  const availableUsers = useMemo<string[]>(() => {
    const users = new Set<string>();
    
    // Extract users from all task types
    const addUsersFromTasks = (tasks: TaskItem[]) => {
      tasks.forEach(task => {
        // Add from different possible user fields
        if (task?.user) users.add(task.user);
        if (task?.assignedTo) users.add(task.assignedTo);
        if (task?.createdBy) users.add(task.createdBy);
      });
    };
    
    // Add users from all task types
    if (data.autopsies) addUsersFromTasks(data.autopsies);
    if (data.earthwork) addUsersFromTasks(data.earthwork);
    if (data.splicing) addUsersFromTasks(data.splicing);
    if (data.lastDrop) addUsersFromTasks(data.lastDrop);
    
    // Convert to array and sort
    return Array.from(users).sort();
  }, [data]);

  // Add this to your initial data fetch
  useEffect(() => {
    // Existing fetchAllData call
    fetchAllData();
    
    // Also fetch timeline events
    updateTimelineEvents();
    
    // Set up refresh intervals
    const dataInterval = setInterval(fetchAllData, 300000); // Refresh every 5 mins
    const eventsInterval = setInterval(updateTimelineEvents, 120000); // Refresh events every 2 mins
    
    // Clean up intervals on component unmount
    return () => {
      clearInterval(dataInterval);
      clearInterval(eventsInterval);
    };
  }, [fetchAllData]);
  
  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Μετάφραση του PLACEHOLDER_DATA
  const PLACEHOLDER_DATA = {
    timelineEvents: [
      {
        time: "08:42",
        event: "Ολοκληρώθηκαν οι χωματουργικές εργασίες στον Βόρειο Τομέα B",
        technician: "Αλέξανδρος Ιωάννου",
        type: "soil",
      },
      {
        time: "09:15",
        event: "Ξεκίνησε η κατασκευή στο Κέντρο της πόλης",
        technician: "Μαρία Γεωργίου",
        type: "construction",
      },
      {
        time: "10:30",
        event: "Ολοκληρώθηκαν οι εργασίες σύνδεσης οπτικών ινών στη Δυτική Περιοχή",
        technician: "Δημήτρης Χατζής",
        type: "splicing",
      },
      {
        time: "11:45",
        event: "Αναφέρθηκε βλάβη εξοπλισμού στην Ανατολική Περιοχή",
        technician: "Σοφία Παπαδοπούλου",
        type: "issue",
      },
      {
        time: "13:20",
        event: "Επιτυχής έλεγχος ποιότητας στη Νότια Περιοχή",
        technician: "Γιάννης Αντωνίου",
        type: "inspection",
      },
    ],
    
    jobLocations: [
      { area: "Κέντρο", soilWork: 8, construction: 12, splicing: 10, completed: 25, progress: 85 },
      { area: "Βόρειος Τομέας", soilWork: 12, construction: 18, splicing: 15, completed: 20, progress: 65 },
      { area: "Δυτική Περιοχή", soilWork: 6, construction: 15, splicing: 12, completed: 30, progress: 78 },
      { area: "Ανατολική Περιοχή", soilWork: 10, construction: 20, splicing: 8, completed: 15, progress: 45 },
      { area: "Νότια Περιοχή", soilWork: 6, construction: 15, splicing: 10, completed: 24, progress: 72 },
    ],
    
    technicians: [
      { id: "T001", name: "Αλέξανδρος Ιωάννου", role: "Χωματουργικά", jobs: 8, efficiency: 92, status: "active" },
      { id: "T002", name: "Μαρία Γεωργίου", role: "Κατασκευή", jobs: 5, efficiency: 88, status: "active" },
      { id: "T003", name: "Δημήτρης Χατζής", role: "Συνδέσεις", jobs: 7, efficiency: 95, status: "active" },
      { id: "T004", name: "Σοφία Παπαδοπούλου", role: "Έλεγχος Ποιότητας", jobs: 10, efficiency: 90, status: "active" },
      { id: "T005", name: "Γιάννης Αντωνίου", role: "Κατασκευή", jobs: 6, efficiency: 85, status: "issue" },
    ],
    
    monthlyData: {
      "Ιαν": { soil: 28, construction: 35, splicing: 22, completed: 18 },
      "Φεβ": { soil: 32, construction: 42, splicing: 28, completed: 30 },
      "Μαρ": { soil: 38, construction: 48, splicing: 35, completed: 40 },
      "Απρ": { soil: 45, construction: 55, splicing: 42, completed: 48 },
      "Μάι": { soil: 40, construction: 62, splicing: 38, completed: 52 },
      "Ιουν": { soil: 42, construction: 58, splicing: 45, completed: 56 },
    }
  };
  
  // Load saved widget visibility and user filter configuration
  useEffect(() => {
    try {
      const savedConfig = safeStorage.getItem('dashboard_widgets');
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          if (parsedConfig) {
            // Update widget visibility while keeping default properties
            if (Array.isArray(parsedConfig.widgets)) {
              setWidgetsConfig(DEFAULT_WIDGETS.map(defaultWidget => {
                const savedWidget = parsedConfig.widgets.find((w: any) => w.id === defaultWidget.id);
                return savedWidget ? { 
                  ...defaultWidget, 
                  visible: savedWidget.visible,
                  selectedApiSource: savedWidget.selectedApiSource || defaultWidget.selectedApiSource
                } : defaultWidget;
              }));
            }
            
            // Load user filter settings
            if (parsedConfig.userFilter) {
              setUserFilter(parsedConfig.userFilter);
            }
            
            // Load per-widget user filter settings
            if (parsedConfig.widgetUserFilters) {
              setWidgetUserFilters(parsedConfig.widgetUserFilters);
            }

            // Load status filter settings
            if (parsedConfig.statusFilter) {
              setStatusFilter(prev => ({
                ...prev,
                ...parsedConfig.statusFilter,
                // Ensure we have entries for all available statuses
                statuses: {
                  ...prev.statuses,
                  ...parsedConfig.statusFilter.statuses
                }
              }));
            }
          }
        } catch (parseError) {
          console.error("Error parsing saved dashboard configuration:", parseError);
          showAlert('error', 'Σφάλμα φόρτωσης αποθηκευμένης διαμόρφωσης. Χρήση προεπιλογών.', 5000);
          setWidgetsConfig(DEFAULT_WIDGETS);
        }
      }
    } catch (err) {
      console.error("Error loading widget configuration:", err);
      showAlert('error', 'Αποτυχία φόρτωσης διαμόρφωσης πίνακα. Χρήση προεπιλογών.', 5000);
      // If error, use default configuration
      setWidgetsConfig(DEFAULT_WIDGETS);
    }
  }, [showAlert]);

  // Get visible and hidden widgets
  const visibleWidgets = useMemo(() => 
    widgetsConfig.filter(widget => widget.visible),
    [widgetsConfig]
  );

  const hiddenWidgets = useMemo(() => 
    widgetsConfig.filter(widget => !widget.visible),
    [widgetsConfig]
  );

  // Dashboard customization handlers
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
    if (isEditMode) {
      // Leaving edit mode, close the hidden panel
      setShowHiddenPanel(false);
    }
  }, [isEditMode]);

  const handleToggleVisibility = useCallback((id: string) => {
    setWidgetsConfig(prevWidgets => 
      prevWidgets.map(widget => 
        widget.id === id 
          ? { ...widget, visible: !widget.visible } 
          : widget
      )
    );
  }, []);

  const handleToggleHiddenPanel = useCallback(() => setShowHiddenPanel(prev => !prev), []);

  const handleSaveLayout = useCallback(() => {
    try {
      // Create minimal data for storage - only essential properties
      const minimalWidgets = widgetsConfig.map(widget => ({
        id: widget.id,
        visible: widget.visible,
        selectedApiSource: widget.selectedApiSource
      }));
      
      // Create minimal config object with all settings
      const configToSave = {
        widgets: minimalWidgets,
        userFilter: userFilter,
        widgetUserFilters: widgetUserFilters,
        statusFilter: statusFilter
      };
      
      // Serialize safely with error handling
      const configJson = JSON.stringify(configToSave);
      
      // Save to localStorage with error handling
      const saved = safeStorage.setItem('dashboard_widgets', configJson);
      
      if (saved) {
        // Notify the user with animated alert
        showAlert('success', 'Η διάταξη του πίνακα αποθηκεύτηκε με επιτυχία!');
      } else {
        showAlert('error', 'Δεν ήταν δυνατή η αποθήκευση του πίνακα - σφάλμα αποθήκευσης. Οι αλλαγές σας δεν θα διατηρηθούν.');
      }
      
      setIsEditMode(false);
    } catch (err) {
      console.error("Error saving layout:", err);
      showAlert('error', 'Αποτυχία αποθήκευσης διάταξης πίνακα. Παρακαλώ δοκιμάστε ξανά.');
    }
  }, [widgetsConfig, userFilter, widgetUserFilters, statusFilter, showAlert]);

  const handleResetLayout = useCallback(() => {
    showConfirmDialog(
      "Επαναφορά Διάταξης Πίνακα",
      "Είστε βέβαιοι ότι θέλετε να επαναφέρετε τον πίνακα στην προεπιλεγμένη διάταξη; Όλες οι προσαρμογές θα χαθούν.",
      () => {
        // Clear saved layout
        safeStorage.removeItem('dashboard_widgets');
        
        // Reset widget visibility to defaults
        setWidgetsConfig(DEFAULT_WIDGETS);
        
        // Reset user filtering
        setUserFilter({ enabled: false, userId: null });
        setWidgetUserFilters({});
        
        // Reset status filtering
        setStatusFilter({
          enabled: false,
          statuses: {
            'ΟΛΟΚΛΗΡΩΣΗ': true,
            'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': true,
            'ΑΠΟΡΡΙΨΗ': true,
            'ΝΕΟ': true
          }
        });
        
        // Show success message
        showAlert('info', 'Επαναφορά πίνακα στην προεπιλεγμένη διάταξη', 3000);
        
        // Close the confirmation dialog
        closeConfirmDialog();
      }
    );
  }, [showConfirmDialog, showAlert, closeConfirmDialog]);
  
  // User filtering handlers
  const handleToggleUserFiltering = useCallback(() => {
    setUserFilter(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
    
    // Show feedback when toggled
    showAlert(
      'info', 
      `Το φιλτράρισμα χρήστη ${userFilter.enabled ? 'απενεργοποιήθηκε' : 'ενεργοποιήθηκε'}`,
      2000
    );
  }, [userFilter.enabled, showAlert]);
  
  const handleUserFilterChange = useCallback((userId: string | null) => {
    setUserFilter(prev => ({
      ...prev,
      userId
    }));
  }, []);
  
  const handleToggleWidgetUserFilter = useCallback((widgetId: string) => {
    setWidgetUserFilters(prev => ({
      ...prev,
      [widgetId]: !prev[widgetId]
    }));
  }, []);
  
  // API source selection handler
  const handleChangeApiSource = useCallback((widgetId: string, source: string) => {
    setWidgetsConfig(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, selectedApiSource: source } 
          : widget
      )
    );
    
    // Show feedback when source is changed
    showAlert('info', `Η πηγή δεδομένων άλλαξε σε ${source}`, 2000);
  }, [showAlert]);

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("el-GR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format date
// Format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Add this to your state declarations
const [expandJobs, setExpandJobs] = useState<boolean>(false);
// Add this state
const [loadingUpcomingJobs, setLoadingUpcomingJobs] = useState(true);

const uniqueTechniciansCount = useMemo(() => {
  const technicians = new Set();
  upcomingJobs.forEach(job => {
    if (job.technicianName) {
      technicians.add(job.technicianName);
    }
  });
  return technicians.size;
}, [upcomingJobs]);


// Get the widget contents with user filtering and API source selection applied
const getWidgetContent = useCallback((widgetId: string) => {
  // Get filtered data for this widget
  const filteredTasks = shouldFilterByUser(widgetId) 
    ? filterTasksByUser(getTasksByApiSource(widgetId)) 
    : getTasksByApiSource(widgetId);
  
  // Get upcoming jobs for job schedule, limited to 5 latest events
  const filteredUpcomingJobs = upcomingJobs.slice(0, 5);
  
  switch (widgetId) {
    case "soilWorkJobs":
      return (
        <JobStatsCard
          title={GREEK_TRANSLATIONS.widgets.soilWorkJobs}
          value={monthlyStats.soilWork.completedTasks} // Show completed tasks only
          icon={Shovel}
          color="blue"
          change={`${monthlyStats.soilWork.growth > 0 ? '+' : ''}${monthlyStats.soilWork.growth}%`} // Growth from previous month
          total={monthlyStats.soilWork.completedTasks}
          isLoading={monthlyStats.loading}
        />
      );
    case "constructionJobs":
      return (
        <JobStatsCard
          title={GREEK_TRANSLATIONS.widgets.constructionJobs}
          value={monthlyStats.construction.completedTasks} // Show completed tasks only
          icon={Construction}
          color="indigo"
          change={`${monthlyStats.construction.growth > 0 ? '+' : ''}${monthlyStats.construction.growth}%`} // Growth from previous month
          total={monthlyStats.construction.completedTasks}
          isLoading={monthlyStats.loading}
        />
      );
    case "splicingJobs":
      return (
        <JobStatsCard
          title={GREEK_TRANSLATIONS.widgets.splicingJobs}
          value={monthlyStats.splicing.completedTasks} // Show completed tasks only
          icon={Tool}
          color="purple"
          change={`${monthlyStats.splicing.growth > 0 ? '+' : ''}${monthlyStats.splicing.growth}%`} // Growth from previous month
          total={monthlyStats.splicing.completedTasks}
          isLoading={monthlyStats.loading}
        />
      );
    case "completedJobs":
      return (
        <JobStatsCard
          title={GREEK_TRANSLATIONS.widgets.completedJobs}
          value={monthlyStats.all.completedTasks} // Total completed tasks across all categories
          icon={CheckCircle}
          color="green"
          change={`${monthlyStats.all.growth > 0 ? '+' : ''}${monthlyStats.all.growth}%`} // Growth from previous month
          total={monthlyStats.all.completedTasks}
          isLoading={monthlyStats.loading}
        />
      );
      case "jobAnalytics":
        return (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <select
                  className="bg-slate-100 border border-slate-200 rounded-md text-sm px-2 py-1 text-slate-600"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {Object.keys(yearlyStats.monthlyData).map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-slate-500"
                  onClick={() => {
                    // Refresh stats if needed
                    showAlert('info', 'Ανανέωση στατιστικών...', 1000);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              {!yearlyStats.loading && (
                <div className="text-sm text-green-600">
                  <TrendingUp className="inline-block mr-1 h-4 w-4" />
                  Ετήσια Ανάπτυξη: {yearlyStats.yearToDateGrowth > 0 ? '+' : ''}{yearlyStats.yearToDateGrowth}%
                </div>
              )}
            </div>
            
            <div className="h-80 w-full relative bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-6">
              {yearlyStats.loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span className="ml-2 text-gray-600">Φόρτωση δεδομένων...</span>
                </div>
              ) : (
                <JobAnalyticsChart data={yearlyStats.monthlyData} selectedMonth={selectedMonth} />
              )}
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
  <div className="flex items-center justify-between mb-4">
    <TabsList className="bg-slate-100 p-1">
      <TabsTrigger value="locations" className="data-[state=active]:bg-aspro data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
        {GREEK_TRANSLATIONS.tabs.locations}
      </TabsTrigger>
      <TabsTrigger value="equipment" className="data-[state=active]:bg-aspro data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">
        {GREEK_TRANSLATIONS.tabs.equipment}
      </TabsTrigger>
    </TabsList>

    <div className="flex items-center space-x-2 text-xs text-slate-500">
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-blue-600 mr-1"></div>
        Χωματουργικά
      </div>
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-indigo-600 mr-1"></div>
        Κατασκευή
      </div>
      <div className="flex items-center">
        <div className="h-2 w-2 rounded-full bg-purple-600 mr-1"></div>
        Συνδέσεις
      </div>
    </div>
  </div>

  <TabsContent value="locations" className="mt-0">
    <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-12 text-xs text-slate-500 p-3 border-b border-slate-200 bg-slate-100">
        <div className="col-span-3">{GREEK_TRANSLATIONS.headers.location}</div>
        <div className="col-span-2">{GREEK_TRANSLATIONS.headers.soilWork}</div>
        <div className="col-span-2">{GREEK_TRANSLATIONS.headers.construction}</div>
        <div className="col-span-2">{GREEK_TRANSLATIONS.headers.splicing}</div>
        <div className="col-span-2">{GREEK_TRANSLATIONS.headers.completed}</div>
        <div className="col-span-1">{GREEK_TRANSLATIONS.headers.progress}</div>
      </div>

      <div className="divide-y divide-slate-200">
        {locationsLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-gray-600">Φόρτωση τοποθεσιών...</span>
          </div>
        ) : jobLocations.length > 0 ? (
          jobLocations.slice(0, 5).map((location, index) => (
            <LocationRow
              key={index}
              area={location.area}
              soilWork={location.soilWork}
              construction={location.construction}
              splicing={location.splicing}
              completed={location.completed}
              progress={location.progress}
            />
          ))
        ) : (
          // Fallback to placeholder data if API data isn't available
          PLACEHOLDER_DATA.jobLocations.map((location, index) => (
            <LocationRow
              key={index}
              area={location.area}
              soilWork={location.soilWork}
              construction={location.construction}
              splicing={location.splicing}
              completed={location.completed}
              progress={location.progress}
            />
          ))
        )}
      </div>
    </div>
  </TabsContent>

  <TabsContent value="equipment" className="mt-0">
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EquipmentItem
          name="Εκσκαφείς"
          total={12}
          inUse={8}
          maintenance={1}
          status="operational"
        />
        <EquipmentItem
          name="Σκαπτικά Μηχανήματα"
          total={15}
          inUse={10}
          maintenance={2}
          status="operational"
        />
        <EquipmentItem
          name="Συγκολλητές Οπτικών Ινών"
          total={20}
          inUse={14}
          maintenance={0}
          status="operational"
        />
        <EquipmentItem
          name="Τροφοδότες Καλωδίων"
          total={8}
          inUse={5}
          maintenance={1}
          status="maintenance"
        />
      </div>
    </div>
  </TabsContent>
</Tabs>
        </div>
      );
    case "postMortemAnalysis":
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.charts.soilAnalysisAccuracy}</div>
            <Badge className="bg-green-50 text-green-600 border-green-200">92%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.charts.constructionQuality}</div>
            <Badge className="bg-green-50 text-green-600 border-green-200">88%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.charts.splicingPrecision}</div>
            <Badge className="bg-amber-50 text-amber-600 border-amber-200">85%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.charts.lastInspection}</div>
            <div className="text-sm text-blue-600">
              {GREEK_TRANSLATIONS.charts.completed} <span className="text-slate-500">2 {GREEK_TRANSLATIONS.charts.hoursAgo}</span>
            </div>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{GREEK_TRANSLATIONS.charts.overallQuality}</div>
              <div className="text-sm text-blue-600">89%</div>
            </div>
            <Progress value={89} className="h-2 bg-slate-100">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{ width: `89%` }}
              />
            </Progress>
          </div>
        </div>
      );
    case "jobSchedule":
      return (
        <div className="space-y-4">
          {loadingUpcomingJobs ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-gray-600">Φόρτωση εργασιών...</span>
            </div>
          ) : filteredUpcomingJobs.length > 0 ? (
            <>
              {filteredUpcomingJobs.slice(0, expandJobs ? undefined : 2).map((event) => (
                <ScheduledJob
                  key={event.id}
                  {...event}
                />
              ))}
              
              {!expandJobs && filteredUpcomingJobs.length > 2 && (
                <button 
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mt-2 flex items-center justify-center"
                  onClick={() => setExpandJobs(true)}
                >
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Εμφάνιση περισσότερων ({filteredUpcomingJobs.length - 2})
                </button>
              )}
              
              {expandJobs && filteredUpcomingJobs.length > 2 && (
                <div className="flex gap-2">
                  <button 
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center"
                    onClick={() => setExpandJobs(false)}
                  >
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Σύμπτυξη
                  </button>
                  <button 
                    className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                    onClick={() => window.location.href = '/Calendar'}
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Ημερολόγιο
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Calendar className="mx-auto h-8 w-8 mb-2 text-gray-400" />
              <p>Δεν βρέθηκαν προσεχείς εργασίες</p>
            </div>
          )}
        </div>
      );
    case "systemTime":
      return (
        <div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 border-b border-slate-200 mb-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <div className="text-xs text-slate-500 mb-1 font-mono">{GREEK_TRANSLATIONS.dashboard.systemTime}</div>
                <div className="text-3xl font-mono text-blue-600 mb-1">{formatTime(currentTime)}</div>
                <div className="text-sm text-slate-600">{formatDate(currentTime)}</div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">{GREEK_TRANSLATIONS.dashboard.activeJobs}</div>
              <div className="text-sm font-mono text-slate-800">
                {monthlyStats.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span>...</span>
                  </div>
                ) : (
                  monthlyStats.all.completedTasks // Show total completed tasks
                )}
              </div>
            </div>
            <div className="bg-slate-50 rounded-md p-3 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">{GREEK_TRANSLATIONS.dashboard.technicians}</div>
              <div className="text-sm font-mono text-green-600">
                {monthlyStats.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin h-3 w-3 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    <span>...</span>
                  </div>
                ) : (
                  `${monthlyStats.uniqueTechnicians.size || 0} ${GREEK_TRANSLATIONS.dashboard.active}`
                )}
              </div>
            </div>
          </div>
        </div>
      );
      case "recentActivity":
        return (
          <div className="relative pl-6 pr-4">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200"></div>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Φόρτωση δεδομένων...</span>
              </div>
            ) : recentEvents.length > 0 ? (
              <div className="space-y-6">
                {recentEvents.map((event, index) => (
                  <TimelineEvent
                    key={index}
                    time={event.time}
                    event={event.event}
                    technician={event.technician}
                    type={event.type}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Activity className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                <p>Δεν βρέθηκαν πρόσφατες δραστηριότητες</p>
              </div>
            )}
          </div>
        );
    case "projectStats":
      return (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.headers.soilWork}</div>
              <div className="text-xs text-blue-600">
                {monthlyStats.loading ? 
                  '...' : 
                  `${Math.round((monthlyStats.soilWork.completedTasks / monthlyStats.all.completedTasks) * 100)}% ${GREEK_TRANSLATIONS.dashboard.ofJobs}`}
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{
                  width: monthlyStats.loading ? '0%' : 
                    `${Math.round((monthlyStats.soilWork.completedTasks / monthlyStats.all.completedTasks) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
    
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.headers.construction}</div>
              <div className="text-xs text-indigo-600">
                {monthlyStats.loading ? 
                  '...' : 
                  `${Math.round((monthlyStats.construction.completedTasks / monthlyStats.all.completedTasks) * 100)}% ${GREEK_TRANSLATIONS.dashboard.ofJobs}`}
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                style={{
                  width: monthlyStats.loading ? '0%' : 
                    `${Math.round((monthlyStats.construction.completedTasks / monthlyStats.all.completedTasks) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
    
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm text-slate-600">{GREEK_TRANSLATIONS.headers.splicing}</div>
              <div className="text-xs text-purple-600">
                {monthlyStats.loading ? 
                  '...' : 
                  `${Math.round((monthlyStats.splicing.completedTasks / monthlyStats.all.completedTasks) * 100)}% ${GREEK_TRANSLATIONS.dashboard.ofJobs}`}
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                style={{
                  width: monthlyStats.loading ? '0%' : 
                    `${Math.round((monthlyStats.splicing.completedTasks / monthlyStats.all.completedTasks) * 100)}%`,
                }}
              ></div>
            </div>
          </div>
    
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <div className="text-slate-600">{GREEK_TRANSLATIONS.dashboard.projectCompletion}</div>
              <div className="text-blue-600 font-medium">
                {monthlyStats.loading ? 
                  '...' : 
                  `${Math.round((monthlyStats.all.completedTasks / (monthlyStats.all.completedTasks + monthlyStats.all.inProgressTasks)) * 100)}%`}
              </div>
            </div>
            <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                style={{
                  width: monthlyStats.loading ? '0%' : 
                    `${Math.round((monthlyStats.all.completedTasks / (monthlyStats.all.completedTasks + monthlyStats.all.inProgressTasks)) * 100)}%`,
                }}
              ></div>
            </div>
            {!monthlyStats.loading && yearlyStats.yearToDateGrowth !== 0 && (
              <div className="mt-2 text-xs flex items-center">
                {yearlyStats.yearToDateGrowth > 0 ? (
                  <div className="text-green-600 flex items-center">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Ετήσια ανάπτυξη: +{yearlyStats.yearToDateGrowth}%
                  </div>
                ) : (
                  <div className="text-red-600 flex items-center">
                    <TrendingDown className="mr-1 h-3 w-3" />
                    Ετήσια μείωση: {yearlyStats.yearToDateGrowth}%
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    default:
      return <div>Unknown widget</div>;
  }
}, [
  shouldFilterByUser, 
  filterTasksByUser,
  getTasksByApiSource,
  data.liveTracking,
  selectedMonth,
  selectedTab,
  currentTime,
  soilWorkJobs,
  constructionJobs,
  splicingJobs,
  completedJobs,
  activeTechnicians,
  formatTime,
  formatDate,
  upcomingJobs,
]);

// Conditional rendering based on state
if (loading && Object.keys(data).length === 0) {
  return <LoadingSpinner />;
}

if (error && Object.keys(data).length === 0) {
  return <ErrorDisplay message={error} />;
}

return (
  <div className="min-h-screen bg-aspro">
    {/* Alerts */}
    <AlertContainer alerts={alerts} onClose={closeAlert} />
    
    {/* Confirmation dialog */}
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      title={confirmDialog.title}
      message={confirmDialog.message}
      onConfirm={confirmDialog.onConfirm}
      onCancel={closeConfirmDialog}
    />

    <div className="container mx-auto p-4">


      {/* Error banner when there's an error but we still have data */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <div className="flex items-center">
            <AlertTriangle className="mr-2" />
            <p>{error}</p>
          </div>
          <button 
            onClick={fetchAllData} 
            className="mt-2 text-sm underline"
          >
            Δοκιμάστε ξανά
          </button>
        </div>
      )}

      {/* Dashboard Controls Panel */}
      {isEditMode && (
        <DashboardControls
          isEditMode={isEditMode}
          onToggleEditMode={handleToggleEditMode}
          onSaveLayout={handleSaveLayout}
          onResetLayout={handleResetLayout}
          onToggleHiddenPanel={handleToggleHiddenPanel}
          hiddenWidgetsCount={hiddenWidgets.length}
          userFilter={userFilter}
          onUserFilterChange={handleUserFilterChange}
          onToggleUserFiltering={handleToggleUserFiltering}
          availableUsers={availableUsers}
          statusFilter={statusFilter}
          onToggleStatusFiltering={handleToggleStatusFiltering}
          onToggleStatus={handleToggleStatus}
          availableStatuses={availableStatuses}
        />
      )}
      
      {/* Hidden Widgets Panel */}
      {showHiddenPanel && (
        <HiddenWidgetsPanel
          hiddenWidgets={hiddenWidgets}
          onShowWidget={handleToggleVisibility}
          isOpen={showHiddenPanel}
          onToggle={handleToggleHiddenPanel}
        />
      )}

      {/* Main Dashboard Grid - Rearranged */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Stat Cards - First Row */}
        {visibleWidgets
          .filter(w => ["soilWorkJobs", "constructionJobs", "splicingJobs", "completedJobs"].includes(w.id))
          .map(widget => (
            <div key={widget.id} className="lg:col-span-3">
              <WidgetContainer 
                title={widget.title} 
                id={widget.id} 
                onToggleVisibility={handleToggleVisibility} 
                isEditMode={isEditMode}
                userFiltered={widget.userFiltered}
                userFilterEnabled={widgetUserFilters[widget.id]}
                onToggleUserFilter={handleToggleWidgetUserFilter}
                apiSourcesSupported={widget.apiSourcesSupported}
                selectedApiSource={widget.selectedApiSource}
                onChangeApiSource={handleChangeApiSource}
              >
                {getWidgetContent(widget.id)}
              </WidgetContainer>
            </div>
          ))}
        
        {/* Job Analytics - Takes 8 columns */}
        {visibleWidgets
          .filter(w => w.id === "jobAnalytics")
          .map(widget => (
            <div key={widget.id} className="lg:col-span-8">
              <WidgetContainer 
                title={widget.title} 
                id={widget.id} 
                onToggleVisibility={handleToggleVisibility} 
                isEditMode={isEditMode}
                userFiltered={widget.userFiltered}
                userFilterEnabled={widgetUserFilters[widget.id]}
                onToggleUserFilter={handleToggleWidgetUserFilter}
                apiSourcesSupported={widget.apiSourcesSupported}
                selectedApiSource={widget.selectedApiSource}
                onChangeApiSource={handleChangeApiSource}
              >
                {getWidgetContent(widget.id)}
              </WidgetContainer>
            </div>
          ))}
        
        {/* Recent Activity - replaced postMortemAnalysis */}
        {visibleWidgets
          .filter(w => ["recentActivity"].includes(w.id))
          .map(widget => (
            <div key={widget.id} className="lg:col-span-4">
              <WidgetContainer 
                title={widget.title} 
                id={widget.id} 
                onToggleVisibility={handleToggleVisibility} 
                isEditMode={isEditMode}
                userFiltered={widget.userFiltered}
                userFilterEnabled={widgetUserFilters[widget.id]}
                onToggleUserFilter={handleToggleWidgetUserFilter}
                apiSourcesSupported={widget.apiSourcesSupported}
                selectedApiSource={widget.selectedApiSource}
                onChangeApiSource={handleChangeApiSource}
              >
                {getWidgetContent(widget.id)}
              </WidgetContainer>
            </div>
          ))}
            
        {/* Job Schedule - 7 columns */}
        {visibleWidgets
          .filter(w => w.id === "jobSchedule")
          .map(widget => (
            <div key={widget.id} className="lg:col-span-7">
              <WidgetContainer 
                title={widget.title} 
                id={widget.id} 
                onToggleVisibility={handleToggleVisibility} 
                isEditMode={isEditMode}
                userFiltered={widget.userFiltered}
                userFilterEnabled={widgetUserFilters[widget.id]}
                onToggleUserFilter={handleToggleWidgetUserFilter}
                apiSourcesSupported={widget.apiSourcesSupported}
                selectedApiSource={widget.selectedApiSource}
                onChangeApiSource={handleChangeApiSource}
              >
                {getWidgetContent(widget.id)}
              </WidgetContainer>
            </div>
          ))}
            
        {/* Live Tracking Map and System Time in a single column - 5 columns */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Project Stats - Now moved under the map */}
          {visibleWidgets
            .filter(w => w.id === "projectStats")
            .map(widget => (
              <div key={widget.id}>
                <WidgetContainer 
                  title={widget.title} 
                  id={widget.id} 
                  onToggleVisibility={handleToggleVisibility} 
                  isEditMode={isEditMode}
                  userFiltered={widget.userFiltered}
                  userFilterEnabled={widgetUserFilters[widget.id]}
                  onToggleUserFilter={handleToggleWidgetUserFilter}
                  apiSourcesSupported={widget.apiSourcesSupported}
                  selectedApiSource={widget.selectedApiSource}
                  onChangeApiSource={handleChangeApiSource}
                >
                  {getWidgetContent(widget.id)}
                </WidgetContainer>
              </div>
            ))}
        </div>
        
        {/* System Time - now full width 3 cols */}
        {visibleWidgets
          .filter(w => w.id === "systemTime")
          .map(widget => (
            <div key={widget.id} className="lg:col-span-6">
              <WidgetContainer 
                title={widget.title} 
                id={widget.id} 
                onToggleVisibility={handleToggleVisibility} 
                isEditMode={isEditMode}
                userFiltered={widget.userFiltered}
                userFilterEnabled={widgetUserFilters[widget.id]}
                onToggleUserFilter={handleToggleWidgetUserFilter}
                apiSourcesSupported={widget.apiSourcesSupported}
                selectedApiSource={widget.selectedApiSource}
                onChangeApiSource={handleChangeApiSource}
              >
                {getWidgetContent(widget.id)}
              </WidgetContainer>
            </div>
          ))}
      </div>
    </div>
  </div>
);
};

export default Dashboard;