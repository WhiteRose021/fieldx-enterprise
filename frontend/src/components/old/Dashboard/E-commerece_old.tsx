"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { warehouseService } from "@/services/warehouseService";
import { 
  Package, PackageOpen, AlertTriangle, CheckCircle, BarChart2, 
  FileDown, PlusCircle, Upload, TrendingUp, TrendingDown, X,
  Eye, EyeOff, Save, RotateCcw, Settings, GripVertical, Maximize, Minimize,
  AlertCircle, ChevronDown, ChevronUp, Filter, Database, Info
} from "lucide-react";
import { ApexOptions } from "apexcharts";

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

// Dynamic imports with proper typing
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });

// API Configuration - Centralized for easier maintenance
const API_CONFIG: Record<string, { url: string; key: string }> = {
  AUTOPSIES: { url: "http://192.168.4.150:8080/api/v1/Aytopsies1", key: "autopsies" },
  EARTHWORK: { url: "http://192.168.4.150:8080/api/v1/CChomatourgika", key: "earthwork" },
  SPLICING: { url: "http://192.168.4.150:8080/api/v1/CSplicingWork", key: "splicing" },
  LAST_DROP: { url: "http://192.168.4.150:8080/api/v1/KataskeyesFTTH", key: "lastDrop" },
  LIVE_TRACKING: { url: "/api/proxy/tracking", key: "liveTracking" },
  WAREHOUSE: { url: "/api/warehouse/products", key: "warehouse" },
};

// Safe storage utility functions to prevent quota errors
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },
  
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }
};

// Default widgets configuration
const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "totalTasks", title: "Total Tasks", visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { id: "completedTasks", title: "Completed Tasks", visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { id: "splicesDone", title: "Splices Done", visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { id: "earthworkKm", title: "Earthwork (km)", visible: true, defaultW: 3, defaultH: 1, userFiltered: true },
  { 
    id: "statusPieChart", 
    title: "Task Status Distribution", 
    visible: true, 
    defaultW: 4, 
    defaultH: 3, 
    minH: 3, 
    userFiltered: true,
    apiSourcesSupported: ["all", "autopsies", "earthwork", "splicing", "lastDrop"],
    selectedApiSource: "all"
  },
  { 
    id: "areaBarChart", 
    title: "Area Progress", 
    visible: true, 
    defaultW: 4, 
    defaultH: 3, 
    minH: 3, 
    userFiltered: true,
    apiSourcesSupported: ["all", "autopsies", "earthwork", "splicing", "lastDrop"],
    selectedApiSource: "all"
  },
  { 
    id: "trendLineChart", 
    title: "Daily Trend", 
    visible: true, 
    defaultW: 4, 
    defaultH: 3, 
    minH: 3, 
    userFiltered: true,
    apiSourcesSupported: ["all", "autopsies", "earthwork", "splicing", "lastDrop"],
    selectedApiSource: "all"
  },
  { id: "vehicleTracking", title: "Vehicle Tracking", visible: true, defaultW: 4, defaultH: 3, minH: 3, userFiltered: false },
  { id: "warehouseMini", title: "Warehouse Snapshot", visible: true, defaultW: 4, defaultH: 3, userFiltered: false },
  { 
    id: "recentIssues", 
    title: "Recent Issues", 
    visible: true, 
    defaultW: 4, 
    defaultH: 3, 
    userFiltered: true,
    apiSourcesSupported: ["all", "autopsies", "earthwork", "splicing", "lastDrop"],
    selectedApiSource: "all"
  }
];

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
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel", 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-scaleIn">
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
  const getDisplayName = (key: string) => {
    switch(key) {
      case 'all': return 'All Sources';
      case 'autopsies': return 'Autopsies';
      case 'earthwork': return 'Earthwork';
      case 'splicing': return 'Splicing Work';
      case 'lastDrop': return 'Last Drop';
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
        <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg z-10 border border-gray-200 py-1 min-w-32">
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
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'ΟΛΟΚΛΗΡΩΣΗ': return { name: 'Completed', color: 'bg-green-100 text-green-800' };
      case 'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': return { name: 'Not Completed', color: 'bg-red-100 text-red-800' };
      case 'ΑΠΟΡΡΙΨΗ': return { name: 'Rejected', color: 'bg-yellow-100 text-yellow-800' };
      case 'ΝΕΟ': return { name: 'New', color: 'bg-blue-100 text-blue-800' };
      default: return { name: status, color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm font-medium">Filter by Status:</span>
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

// Reusable Stat Card Component with explicit typing
const StatCard: React.FC<{
  title: string;
  value: number | string;
  subValue?: string;
  color: string;
  icon: React.ElementType;
}> = ({ title, value, subValue, color, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
    <div className={`p-3 rounded-full ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-sm text-gray-500">{subValue}</p>}
    </div>
  </div>
);

// Widget Container Component
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
    <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
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
              title={userFilterEnabled ? "Disable user filtering" : "Enable user filtering"}
            >
              <Filter size={18} />
            </button>
          )}
          {isEditMode && (
            <button 
              onClick={() => onToggleVisibility(id)} 
              className="text-gray-500 hover:text-gray-700"
              title="Hide widget"
            >
              <EyeOff size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

// Pie Chart for Status Distribution with explicit typing
const StatusPieChart: React.FC<{ data: TaskItem[] }> = React.memo(({ data }) => {
  const statusCounts = useMemo(() => {
    return data.reduce<Record<string, number>>((acc, item) => {
      const status = item?.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }, [data]);

  const chartOptions: ApexOptions = {
    chart: { type: "pie" },
    labels: Object.keys(statusCounts),
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
    legend: { position: "bottom" },
    title: { text: "Task Status", align: "center" },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { width: 300 },
        legend: { position: "bottom" }
      }
    }]
  };

  return (
    <ReactApexChart 
      options={chartOptions} 
      series={Object.values(statusCounts)} 
      type="pie" 
      height={300} 
    />
  );
});

StatusPieChart.displayName = "StatusPieChart";

// Bar Chart for Area Progress with explicit typing
const AreaBarChart: React.FC<{ data: TaskItem[] }> = React.memo(({ data }) => {
  const { areas, seriesData } = useMemo(() => {
    const areaSet = new Set<string>();
    data.forEach(item => {
      if (item?.addressCity) {
        areaSet.add(item.addressCity);
      } else {
        areaSet.add("Unknown");
      }
    });
    
    const areas = Array.from(areaSet);
    
    const seriesData = areas.map(area => 
      data.filter(item => (item?.addressCity || "Unknown") === area && item?.status === "ΟΛΟΚΛΗΡΩΣΗ").length
    );
    
    return { areas, seriesData };
  }, [data]);

  const chartOptions: ApexOptions = {
    chart: { type: "bar" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
    colors: ["#10B981"],
    xaxis: { categories: areas, title: { text: "Areas" } },
    yaxis: { title: { text: "Completed Tasks" } },
    title: { text: "Area Progress", align: "center" },
  };

  return (
    <ReactApexChart 
      options={chartOptions} 
      series={[{ name: "Completed", data: seriesData }]} 
      type="bar" 
      height={300} 
    />
  );
});

AreaBarChart.displayName = "AreaBarChart";

// Line Chart for Daily Trend with explicit typing
const TrendLineChart: React.FC<{ data: TaskItem[] }> = React.memo(({ data }) => {
  const { dates, counts } = useMemo(() => {
    const dailyData = data.reduce<Record<string, number>>((acc, item) => {
      // Safely handle potentially undefined date fields
      const dateStr = item?.createdAt || item?.dateStart || '';
      if (dateStr) {
        try {
          const date = new Date(dateStr).toLocaleDateString();
          if (date && date !== 'Invalid Date') {
            acc[date] = (acc[date] || 0) + (item?.status === "ΟΛΟΚΛΗΡΩΣΗ" ? 1 : 0);
          }
        } catch (e) {
          // Silently handle date parsing errors
        }
      }
      return acc;
    }, {});
    
    return { 
      dates: Object.keys(dailyData), 
      counts: Object.values(dailyData)
    };
  }, [data]);

  const chartOptions: ApexOptions = {
    chart: { type: "line" },
    stroke: { curve: "smooth", width: 2 },
    xaxis: { categories: dates, title: { text: "Date" } },
    yaxis: { title: { text: "Installations" } },
    title: { text: "Daily Trend", align: "center" },
    colors: ["#3B82F6"],
  };

  return (
    <ReactApexChart 
      options={chartOptions} 
      series={[{ name: "Installations", data: counts }]} 
      type="line" 
      height={300} 
    />
  );
});

TrendLineChart.displayName = "TrendLineChart";

// Live Tracking Map with explicit typing
const LiveTrackingMap: React.FC<{ vehicles: Vehicle[] }> = React.memo(({ vehicles = [] }) => {
  const center: [number, number] = [37.9838, 23.7275]; // Athens coordinates
  const mapRef = useRef(null);

  const vehicleIcon = useMemo(() => L.divIcon({
    html: '<div class="bg-blue-500 w-4 h-4 rounded-full border-2 border-white"></div>',
    className: "",
    iconSize: [16, 16],
  }), []);

  // Filter out vehicles with invalid coordinates
  const validVehicles = useMemo(() => 
    vehicles.filter(v => 
      typeof v?.lat === 'number' && 
      typeof v?.lng === 'number' && 
      !isNaN(v.lat) && 
      !isNaN(v.lng)
    ), 
    [vehicles]
  );

  // Fix Leaflet map size invalidation issue
  useEffect(() => {
    // Fix for Leaflet map when in hidden containers
    if (mapRef.current) {
      const leafletContainer = document.querySelector('.leaflet-container');
      if (leafletContainer) {
        const resizeObserver = new ResizeObserver(() => {
          setTimeout(() => {
            const map = mapRef.current;
            if (map) {
              map.invalidateSize();
            }
          }, 0);
        });

        resizeObserver.observe(leafletContainer);
        return () => {
          resizeObserver.disconnect();
        };
      }
    }
  }, []);

  // Handle when map comes into view
  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    
    // Fix initial size
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        // If we have valid vehicles, fit bounds to show them all
        if (validVehicles.length > 0) {
          const bounds = L.latLngBounds(validVehicles.map(v => [v.lat, v.lng]));
          mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }, 100);
  }, [validVehicles]);

  return (
    <MapContainer 
      center={center} 
      zoom={12} 
      style={{ height: "250px", width: "100%" }}
      whenCreated={handleMapLoad}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {validVehicles.map(vehicle => (
        <Marker 
          key={vehicle.id} 
          position={[vehicle.lat, vehicle.lng]} 
          icon={vehicleIcon} 
        />
      ))}
    </MapContainer>
  );
});

LiveTrackingMap.displayName = "LiveTrackingMap";

// Warehouse Mini-Section with explicit typing
const WarehouseMini: React.FC<{ 
  products: Product[]; 
  onAddProduct: () => void;
}> = React.memo(({ products = [], onAddProduct }) => {
  const stats = useMemo(() => ({
    totalStock: products.reduce((sum, p) => sum + (p?.stock || 0), 0),
    lowStock: products.filter(p => p?.stock > 0 && p?.stock <= 5).length,
  }), [products]);

  return (
    <div className="bg-white h-full">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Stock</p>
          <p className="text-xl font-bold">{stats.totalStock}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Low Stock Items</p>
          <p className="text-xl font-bold">{stats.lowStock}</p>
        </div>
      </div>
      <button
        onClick={onAddProduct}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <PlusCircle size={16} /> Add Product
      </button>
    </div>
  );
});

WarehouseMini.displayName = "WarehouseMini";

// Product Form Modal Component with explicit typing
const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: ProductFormData) => Promise<void>;
}> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<ProductFormData>({ 
    name: "", 
    sku: "", 
    category: "", 
    quantity: 0 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === "quantity" ? Number(value) : value 
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ name: "", sku: "", category: "", quantity: 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Product</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {[
              { name: "name" as const, type: "text", label: "Product Name" },
              { name: "sku" as const, type: "text", label: "SKU" },
              { name: "category" as const, type: "text", label: "Category" },
              { name: "quantity" as const, type: "number", label: "Quantity" }
            ].map(field => (
              <div key={field.name}>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg p-2"
                  required
                  min={field.type === "number" ? 0 : undefined}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Recent Issues Table with explicit typing
const RecentIssuesTable: React.FC<{ tasks: TaskItem[] }> = ({ tasks = [] }) => {
  const issues = useMemo(() => 
    tasks
      .filter(t => t?.status === "ΜΗ ΟΛΟΚΛΗΡΩΣΗ")
      .slice(0, 5), 
    [tasks]
  );

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-gray-50">
          <th className="py-2 px-4 text-left text-gray-700">SR</th>
          <th className="py-2 px-4 text-left text-gray-700">Status</th>
          <th className="py-2 px-4 text-left text-gray-700">Location</th>
        </tr>
      </thead>
      <tbody>
        {issues.length > 0 ? (
          issues.map((task, i) => (
            <tr key={`issue-${i}-${task.sr || i}`} className="hover:bg-gray-50">
              <td className="py-2 px-4">{task.sr || "N/A"}</td>
              <td className="py-2 px-4">
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                  {task.status}
                </span>
              </td>
              <td className="py-2 px-4">{task.addressCity || "N/A"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} className="py-4 text-center text-gray-500">
              No unresolved issues
            </td>
          </tr>
        )}
      </tbody>
    </table>
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Hidden Widgets</h2>
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
              title="Show widget"
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

// Error Display Component with explicit typing
const ErrorDisplay: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-6">
    <div className="text-red-600 mb-4">
      <AlertTriangle size={48} />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
    <p className="text-gray-600 mb-6">{message}</p>
    <button 
      onClick={() => window.location.reload()} 
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Try Again
    </button>
  </div>
);

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
      <label className="text-sm font-medium">Filter by User:</label>
      <select 
        value={selectedUser || ''}
        onChange={(e) => onSelectUser(e.target.value || null)}
        className="border border-gray-300 rounded-lg p-1 text-sm"
      >
        <option value="">All Users</option>
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
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Settings className="text-blue-600" /> Dashboard Controls
        </h2>
        <div className="flex gap-3">
          {hiddenWidgetsCount > 0 && (
            <button
              onClick={onToggleHiddenPanel}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Eye size={16} /> Hidden ({hiddenWidgetsCount})
            </button>
          )}
          {isEditMode && (
            <button
              onClick={onToggleUserFiltering}
              className={`px-4 py-2 ${userFilter.enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'} rounded-lg hover:bg-gray-200 flex items-center gap-1`}
              title={userFilter.enabled ? "Disable user filtering" : "Enable user filtering"}
            >
              <Filter size={16} /> User Filter {userFilter.enabled ? 'On' : 'Off'}
            </button>
          )}
          {isEditMode && (
            <button
              onClick={onToggleStatusFiltering}
              className={`px-4 py-2 ${statusFilter.enabled ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'} rounded-lg hover:bg-gray-200 flex items-center gap-1`}
              title={statusFilter.enabled ? "Disable status filtering" : "Enable status filtering"}
            >
              <CheckCircle size={16} /> Status Filter {statusFilter.enabled ? 'On' : 'Off'}
            </button>
          )}
          <button
            onClick={onResetLayout}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 flex items-center gap-1"
          >
            <RotateCcw size={16} /> Reset
          </button>
          {isEditMode && (
            <button
              onClick={onSaveLayout}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Save size={16} /> Save
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
                <CheckCircle size={16} /> Done
              </>
            ) : (
              <>
                <Settings size={16} /> Customize
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

// Main Dashboard Component
const Dashboard: React.FC = () => {
  const [data, setData] = useState<Partial<DashboardData>>({});
  const [warehouseProducts, setWarehouseProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("User");
  
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

  useEffect(() => {
      try {
         const userSession = localStorage.getItem('user_session');
         if (userSession) {
           const userData = JSON.parse(userSession);
           setUserName(userData.name || 'User');
         }
       } catch (err) {
         console.error("Error loading user data:", err);
       }
   }, []);
  
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
  
  // Memoized derived data to prevent recalculations - MOVED BEFORE any code that depends on it
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
  const shouldFilterByUser = useCallback((widgetId: string) => {
    return userFilter.enabled && 
           userFilter.userId && 
           widgetUserFilters[widgetId] === true;
  }, [userFilter, widgetUserFilters]);

  // Function to filter tasks by the selected user
  const filterTasksByUser = useCallback((tasks: TaskItem[]) => {
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

  // Status filtering handlers
  const handleToggleStatusFiltering = useCallback(() => {
    setStatusFilter(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
    
    // Show feedback when toggled
    showAlert(
      'info', 
      `Status filtering ${statusFilter.enabled ? 'disabled' : 'enabled'}`,
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
      showAlert('info', 'All statuses selected - must select at least one status', 2000);
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
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Initial data fetch and polling setup
  useEffect(() => {
    fetchAllData();
    
    // Set up refresh interval for live data
    const interval = setInterval(fetchAllData, 300000); // Refresh every 5 mins
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [fetchAllData]);
  
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
          showAlert('error', 'Error loading saved configuration. Using defaults.', 5000);
          setWidgetsConfig(DEFAULT_WIDGETS);
        }
      }
    } catch (err) {
      console.error("Error loading widget configuration:", err);
      showAlert('error', 'Failed to load dashboard configuration. Using defaults.', 5000);
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

  // Modal handlers
  const handleAddProduct = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleSaveProduct = useCallback(async (productData: ProductFormData) => {
    try {
      setLoading(true);
      await warehouseService.createProduct({
        ...productData,
        stock: productData.quantity // Map quantity to stock for API
      });
      
      // Refresh warehouse products
      const response = await warehouseService.getProducts({});
      setWarehouseProducts(response.products || []);
      setIsModalOpen(false);
      showAlert('success', 'Product added successfully!');
    } catch (err) {
      console.error("Failed to add product:", err);
      setError("Failed to add product. Please try again.");
      showAlert('error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

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
        showAlert('success', 'Dashboard layout saved successfully!');
      } else {
        showAlert('error', 'Could not save dashboard - storage error. Your changes will not persist.');
      }
      
      setIsEditMode(false);
    } catch (err) {
      console.error("Error saving layout:", err);
      showAlert('error', 'Failed to save dashboard layout. Please try again.');
    }
  }, [widgetsConfig, userFilter, widgetUserFilters, statusFilter, showAlert]);

  const handleResetLayout = useCallback(() => {
    showConfirmDialog(
      "Reset Dashboard Layout",
      "Are you sure you want to reset the dashboard to default layout? All customizations will be lost.",
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
        showAlert('info', 'Dashboard reset to default layout', 3000);
        
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
      `User filtering ${userFilter.enabled ? 'disabled' : 'enabled'}`,
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
    showAlert('info', `Data source changed to ${source}`, 2000);
  }, [showAlert]);

  // Filter stats based on user selection and API source
  const getFilteredStats = useCallback((widgetId: string) => {
    // First filter by API source
    let sourceTasks = getTasksByApiSource(widgetId);
    let sourceSplicing = widgetId === "splicesDone" ? (data.splicing || []) : [];
    let sourceEarthwork = widgetId === "earthworkKm" ? (data.earthwork || []) : [];
    
    // Then apply user filter if needed
    if (shouldFilterByUser(widgetId)) {
      sourceTasks = filterTasksByUser(sourceTasks);
      sourceSplicing = filterTasksByUser(sourceSplicing);
      sourceEarthwork = filterTasksByUser(sourceEarthwork);
    }
    
    // Calculate stats from filtered data
    return {
      totalTasks: sourceTasks.length,
      completedTasks: sourceTasks.filter(t => t?.status === "ΟΛΟΚΛΗΡΩΣΗ").length,
      splicesDone: sourceSplicing.filter(s => s?.status === "ΟΛΟΚΛΗΡΩΣΗ").length,
      earthworkKm: sourceEarthwork.reduce((acc, e) => acc + (e?.length || 0), 0) / 1000,
    };
  }, [shouldFilterByUser, filterTasksByUser, getTasksByApiSource, data]);

  // Get the widget contents with user filtering and API source selection applied
  const getWidgetContent = useCallback((widgetId: string) => {
    // Get filtered data for this widget
    const widgetStats = getFilteredStats(widgetId);
    const widgetCompletionPercentage = widgetStats.totalTasks > 0 
      ? ((widgetStats.completedTasks / widgetStats.totalTasks) * 100).toFixed(1) 
      : "0.0";
    
    // Get tasks filtered by both user and API source
    const filteredTasks = shouldFilterByUser(widgetId) 
      ? filterTasksByUser(getTasksByApiSource(widgetId)) 
      : getTasksByApiSource(widgetId);
    
    switch (widgetId) {
      case "totalTasks":
        return (
          <StatCard 
            title="Total Tasks" 
            value={widgetStats.totalTasks} 
            color="bg-blue-500" 
            icon={Package} 
          />
        );
      case "completedTasks":
        return (
          <StatCard 
            title="Completed Tasks" 
            value={widgetStats.completedTasks} 
            subValue={`${widgetCompletionPercentage}%`} 
            color="bg-green-500" 
            icon={CheckCircle} 
          />
        );
      case "splicesDone":
        return (
          <StatCard 
            title="Splices Done" 
            value={widgetStats.splicesDone} 
            color="bg-purple-500" 
            icon={TrendingUp} 
          />
        );
      case "earthworkKm":
        return (
          <StatCard 
            title="Earthwork (km)" 
            value={widgetStats.earthworkKm.toFixed(2)} 
            color="bg-orange-500" 
            icon={BarChart2} 
          />
        );
      case "statusPieChart":
        return <StatusPieChart data={filteredTasks} />;
      case "areaBarChart":
        return <AreaBarChart data={filteredTasks} />;
      case "trendLineChart":
        return <TrendLineChart data={filteredTasks} />;
      case "vehicleTracking":
        return <LiveTrackingMap vehicles={data.liveTracking || []} />;
      case "warehouseMini":
        return (
          <WarehouseMini 
            products={warehouseProducts} 
            onAddProduct={handleAddProduct} 
          />
        );
      case "recentIssues":
        return <RecentIssuesTable tasks={filteredTasks} />;
      default:
        return <div>Unknown widget</div>;
    }
  }, [
    getFilteredStats, 
    shouldFilterByUser, 
    filterTasksByUser,
    getTasksByApiSource,
    data.liveTracking, 
    warehouseProducts, 
    handleAddProduct
  ]);

  // Conditional rendering based on state
  if (loading && Object.keys(data).length === 0) {
    return <LoadingSpinner />;
  }
  
  if (error && Object.keys(data).length === 0) {
    return <ErrorDisplay message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Welcome, {userName}, to FieldX FSM</h1>

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
              Retry
            </button>
          </div>
        )}

        {/* Dashboard Controls */}
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

        {/* Hidden Widgets Panel */}
        {isEditMode && (
          <HiddenWidgetsPanel 
            hiddenWidgets={hiddenWidgets} 
            onShowWidget={handleToggleVisibility} 
            isOpen={showHiddenPanel} 
            onToggle={handleToggleHiddenPanel} 
          />
        )}

        {/* Main Dashboard Section*/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
          {/* Stat Cards - First Row */}
          {visibleWidgets
            .filter(w => ["totalTasks", "completedTasks", "splicesDone", "earthworkKm"].includes(w.id))
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
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {userFilter.enabled && widgetUserFilters[widget.id] && widget.userFiltered && (
                      <span className="text-blue-600 font-medium">
                        User: {userFilter.userId || 'All'}
                      </span>
                    )}
                    {statusFilter.enabled && (
                      <span className="text-purple-600 font-medium">
                        Status: {Object.entries(statusFilter.statuses)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([status]) => status)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </WidgetContainer>
              </div>
            ))}
          
          {/* Charts and tables - Second Row */}
          {visibleWidgets
            .filter(w => !["totalTasks", "completedTasks", "splicesDone", "earthworkKm"].includes(w.id))
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
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {userFilter.enabled && widgetUserFilters[widget.id] && widget.userFiltered && (
                      <span className="text-blue-600 font-medium">
                        User: {userFilter.userId || 'All'}
                      </span>
                    )}
                    {statusFilter.enabled && (
                      <span className="text-purple-600 font-medium">
                        Status: {Object.entries(statusFilter.statuses)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([status]) => status)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                </WidgetContainer>
              </div>
            ))}
        </div>

        {/* Product Modal */}
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal} 
          onSave={handleSaveProduct} 
        />
      </div>
    </div>
  );
};

export default Dashboard;