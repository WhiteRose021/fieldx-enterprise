"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { debounce } from "lodash-es";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Search, X, FileText, Filter, MapPin, CalendarDays, 
  Phone, Building2, Grid, List, RefreshCcw, Loader2, 
  AlertCircle, CheckCircle2, Clock, Send, ArrowUpDown,
  Wrench, Plus 
} from "lucide-react";
import useLocalStorage from "@/hooks/useLocalStorage";
import { 
  useMalfunctions, 
  useMalfunctionsStats, 
  type Malfunction, 
  type Filters, 
  type SortConfig 
} from "@/lib/api/malfunctions";

// Components
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import Pagination from "@/components/Pagination/Pagination";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";
import { useToast } from "@/hooks/use-toast";

// Constants
const ITEMS_PER_PAGE = 21;

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  isLoading?: boolean;
  color?: string;
}

export default function MalfunctionsPage() {
  // URL and Router for state persistence
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // State with localStorage persistence
  const [currentPage, setCurrentPage] = useLocalStorage<number>("malfunctionsList_currentPage", 1);
  const [searchTerm, setSearchTerm] = useLocalStorage<string>("malfunctionsList_searchTerm", "");
  const [view, setView] = useLocalStorage<"grid" | "list">("malfunctionsList_view", "grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortConfig, setSortConfig] = useLocalStorage<SortConfig>("malfunctionsList_sortConfig", {
    field: "createdAt",
    direction: "desc", // Default to newest first
  });
  const [filters, setFilters] = useLocalStorage<Filters>("malfunctionsList_filters", {
    status: "",
    ttlp: "",
    dateFrom: "",
    dateTo: "",
    ak: "",
  });

  // Data fetching with React Query
  const {
    data: malfunctionsData,
    isLoading,
    error,
    refetch,
  } = useMalfunctions(currentPage, ITEMS_PER_PAGE, searchTerm, filters, sortConfig) as {
    data: { list: Malfunction[]; total: number } | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
  };
  
  // Stats fetching with React Query
  const { data: statsData, isLoading: statsLoading } = useMalfunctionsStats();
  
  // Ensure proper typing for data access and limit records per page
  const records: Malfunction[] = malfunctionsData?.list?.slice(0, ITEMS_PER_PAGE) ?? [];
  const totalRecords: number = malfunctionsData?.total ?? 0;
  
  // Preserve search params in URL for shareable links
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (currentPage > 1) params.set("page", currentPage.toString());
    else params.delete("page");
    
    if (searchTerm) params.set("search", searchTerm);
    else params.delete("search");
    
    if (view !== "grid") params.set("view", view);
    else params.delete("view");
    
    if (sortConfig.field !== "createdAt" || sortConfig.direction !== "desc") {
      params.set("sort", `${sortConfig.field}:${sortConfig.direction}`);
    } else {
      params.delete("sort");
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    
    const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
    window.history.replaceState({}, "", newUrl);
  }, [currentPage, searchTerm, view, sortConfig, filters, pathname, searchParams]);
  
  // Initialize state from URL on first load
  useEffect(() => {
    if (searchParams.has("page")) {
      const page = parseInt(searchParams.get("page") || "1", 10);
      setCurrentPage(isNaN(page) ? 1 : page);
    }
    
    if (searchParams.has("search")) {
      setSearchTerm(searchParams.get("search") || "");
    }
    
    if (searchParams.has("view")) {
      const viewParam = searchParams.get("view");
      if (viewParam === "grid" || viewParam === "list") {
        setView(viewParam);
      }
    }
    
    if (searchParams.has("sort")) {
      const sortParam = searchParams.get("sort") || "";
      const [field, direction] = sortParam.split(":");
      if (field && (direction === "asc" || direction === "desc")) {
        setSortConfig({ field, direction: direction as "asc" | "desc" });
      }
    }
    
    const urlFilters: Partial<Filters> = {};
    ["status", "ttlp", "dateFrom", "dateTo", "ak"].forEach((key) => {
      if (searchParams.has(key)) {
        urlFilters[key as keyof Filters] = searchParams.get(key) || "";
      }
    });
    
    if (Object.keys(urlFilters).length > 0) {
      setFilters((prev: Filters) => ({ ...prev, ...urlFilters }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Filter Handling
  const handleFilterChange = useCallback((filterType: keyof Filters, value: string) => {
    setFilters((prev: Filters) => ({
      ...prev,
      [filterType]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  }, [setFilters, setCurrentPage]);
  
  // Sort Handling
  const handleSort = useCallback((field: string) => {
    setSortConfig((prev: SortConfig) => ({
      field,
      direction: prev.field === field && prev.direction === "desc" ? "asc" : "desc",
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
    setShowSortOptions(false);
  }, [setSortConfig, setCurrentPage]);
  
  // Reset Filters
  const resetFilters = useCallback(() => {
    setFilters({
      status: "",
      ttlp: "",
      dateFrom: "",
      dateTo: "",
      ak: "",
    });
    setSearchTerm("");
    setSortConfig({ field: "createdAt", direction: "desc" }); // Reset to newest first
    setCurrentPage(1);
  }, [setFilters, setSearchTerm, setSortConfig, setCurrentPage]);
  
  // Handle search with debounce
  const debouncedSearch = useMemo(() => 
    debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to first page on new search
    }, 300),
    [setSearchTerm, setCurrentPage]
  );
  
  // Error Handling
  useEffect(() => {
    if (error) {
      console.error("API Error:", error);
      toast({
        title: "Σφάλμα",
        description: "Παρουσιάστηκε σφάλμα κατά τη φόρτωση των δεδομένων",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Helper Functions
  const formatDate = useCallback((dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("el-GR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);
  
  const getStatusColor = useCallback((status: string) => {
    const colors: Record<string, string> = {
      "ΟΛΟΚΛΗΡΩΣΗ": "bg-green-100 text-green-800 border border-green-300",
      "ΑΠΟΣΤΟΛΗ": "bg-blue-100 text-blue-800 border border-blue-300",
      "ΜΗ ΟΛΟΚΛΗΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300",
      "ΑΠΟΡΡΙΨΗ": "bg-gray-100 text-gray-800 border border-gray-300",
      "ΝΕΟ": "bg-purple-100 text-purple-800 border border-purple-300",
      "ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ": "bg-yellow-100 text-yellow-800 border border-yellow-300",
      "ΑΚΥΡΩΣΗ": "bg-red-100 text-red-800 border border-red-300"
    };
    return colors[status] || "bg-yellow-100 text-yellow-800 border border-yellow-300";
  }, []);
  
  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "ΟΛΟΚΛΗΡΩΣΗ":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "ΑΠΟΣΤΟΛΗ":
        return <Send className="h-4 w-4 text-blue-600" />;
      case "ΜΗ ΟΛΟΚΛΗΡΩΣΗ":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "ΑΠΟΡΡΙΨΗ":
        return <X className="h-4 w-4 text-gray-600" />;
      case "ΝΕΟ":
        return <FileText className="h-4 w-4 text-purple-600" />;
      default:
        return <FileText className="h-4 w-4 text-yellow-600" />;
    }
  }, []);
  
  // Component Functions
  const StatsCard = useCallback<React.FC<StatsCardProps>>(
    ({ title, value, icon, description, isLoading = false, color = "blue" }) => {
      const colorClasses: Record<string, { bg: string, text: string, ring: string }> = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", ring: "ring-blue-600/20" },
        green: { bg: "bg-green-50", text: "text-green-600", ring: "ring-green-600/20" },
        yellow: { bg: "bg-yellow-50", text: "text-yellow-600", ring: "ring-yellow-600/20" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", ring: "ring-purple-600/20" },
        red: { bg: "bg-red-50", text: "text-red-600", ring: "ring-red-600/20" }
      };
      
      const classes = colorClasses[color] || colorClasses.blue;
      
      return (
        <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 relative overflow-hidden group">
          <div className={`absolute inset-0 ${classes.bg} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              {isLoading ? (
                <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-2"></div>
              ) : (
                <h3 className="text-2xl font-bold mt-2 text-gray-900">{value.toLocaleString()}</h3>
              )}
            </div>
            <div className={`rounded-lg ${classes.bg} p-3 ${classes.text} ring-1 ${classes.ring}`}>
              {icon}
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
          <div className={`h-1 w-full absolute bottom-0 left-0 ${classes.bg}`}></div>
        </div>
      );
    },
    []
  );
  
  const SortOptionsPopup = useMemo(() => () => {
    if (!showSortOptions) return null;
    
    return (
      <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 border border-gray-200">
        <div className="py-1">
          <button
            onClick={() => handleSort("createdAt")}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              sortConfig.field === "createdAt" ? "bg-gray-50 font-bold" : ""
            }`}
            aria-label="Sort by creation date"
          >
            Ημερομηνία Δημιουργίας{" "}
            {sortConfig.field === "createdAt" && (sortConfig.direction === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("name")}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              sortConfig.field === "name" ? "bg-gray-50 font-bold" : ""
            }`}
            aria-label="Sort by reference number"
          >
            Αριθμός Αναφοράς{" "}
            {sortConfig.field === "name" && (sortConfig.direction === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("status")}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              sortConfig.field === "status" ? "bg-gray-50 font-bold" : ""
            }`}
            aria-label="Sort by status"
          >
            Κατάσταση {sortConfig.field === "status" && (sortConfig.direction === "desc" ? "↓" : "↑")}
          </button>
          <button
            onClick={() => handleSort("modifiedAt")}
            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
              sortConfig.field === "modifiedAt" ? "bg-gray-50 font-bold" : ""
            }`}
            aria-label="Sort by last modified date"
          >
            Τελευταία Τροποποίηση{" "}
            {sortConfig.field === "modifiedAt" && (sortConfig.direction === "desc" ? "↓" : "↑")}
          </button>
        </div>
      </div>
    );
  }, [showSortOptions, sortConfig, handleSort]);
  
  // Main render sections - memoized to avoid unnecessary re-renders
  
  // Stats Section
  const renderStats = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Συνολικές Βλάβες"
        value={statsData?.total || 0}
        icon={<Clock className="h-6 w-6" />}
        description="Συνολικός αριθμός βλαβών"
        isLoading={statsLoading}
        color="blue"
      />
      <StatsCard
        title="Ολοκληρωμένες"
        value={statsData?.completed || 0}
        icon={<CheckCircle2 className="h-6 w-6" />}
        description="Βλάβες που επιδιορθώθηκαν"
        isLoading={statsLoading}
        color="green"
      />
      <StatsCard
        title="Σε Εκκρεμότητα"
        value={statsData?.pending || 0}
        icon={<AlertCircle className="h-6 w-6" />}
        description="Βλάβες σε εκκρεμότητα"
        isLoading={statsLoading}
        color="yellow"
      />
      <StatsCard
        title="Απεσταλμένες"
        value={statsData?.sent || 0}
        icon={<Send className="h-6 w-6" />}
        description="Βλάβες που έχουν αποσταλεί"
        isLoading={statsLoading}
        color="purple"
      />
    </div>
  ), [statsData, statsLoading, StatsCard]);
  
  // Filters Section
  const renderFilters = useMemo(() => (
    <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-200 shadow-md animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Φίλτρα Αναζήτησης</h3>
        <button 
          onClick={resetFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          <span>Επαναφορά</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Κατάσταση</label>
          <select
            value={filters.status || ""}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Όλες</option>
            <option value="ΝΕΟ">Νέο</option>
            <option value="ΑΠΟΣΤΟΛΗ">Αποστολή</option>
            <option value="ΟΛΟΚΛΗΡΩΣΗ">Ολοκλήρωση</option>
            <option value="ΜΗ ΟΛΟΚΛΗΡΩΣΗ">Μη Ολοκλήρωση</option>
            <option value="ΑΠΟΡΡΙΨΗ">Απόρριψη</option>
            <option value="ΧΕΙΡΟΚΙΝΗΤΟΣ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ">Χειροκίνητος Προγραμματισμός</option>
          </select>
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">TTLP</label>
          <select
            value={filters.ttlp || ""}
            onChange={(e) => handleFilterChange("ttlp", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Όλα</option>
            <option value="Τ.Τ.Λ.Π. ΕΥΒΟΙΑΣ">Τ.Τ.Λ.Π. ΕΥΒΟΙΑΣ</option>
            <option value="Τ.Τ.Λ.Π. ΒΟΡ. ΠΡΟΑΣΤΙΩΝ">Τ.Τ.Λ.Π. ΒΟΡ. ΠΡΟΑΣΤΙΩΝ</option>
            <option value="Τ.Τ.Λ.Π. ΑΛΥΣΙΔΑΣ">Τ.Τ.Λ.Π. ΑΛΥΣΙΔΑΣ</option>
            <option value="Τ.Τ.Λ.Π. ΑΓ. ΠΑΡΑΣΚΕΥΗΣ">Τ.Τ.Λ.Π. ΑΓ. ΠΑΡΑΣΚΕΥΗΣ</option>
            <option value="Τ.Τ.Λ.Π. ΧΑΛΑΝΔΡΙΟΥ">Τ.Τ.Λ.Π. ΧΑΛΑΝΔΡΙΟΥ</option>
          </select>
        </div>
        
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">ΑΚ</label>
          <select
            value={filters.ak || ""}
            onChange={(e) => handleFilterChange("ak", e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Όλα</option>
            <option value="ΧΑΛ">ΧΑΛ</option>
            <option value="ΝΚΗΦ">ΝΚΗΦ</option>
            <option value="ΚΑΛ">ΚΑΛ</option>
            <option value="ΠΕΝΤ">ΠΕΝΤ</option>
          </select>
        </div>
        
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <label className="block text-sm font-medium text-gray-700">Εύρος Ημερομηνίας</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by start date"
              />
            </div>
            <div>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Filter by end date"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-5 flex justify-end gap-3">
        <button
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
          onClick={() => setShowFilters(false)}
        >
          Κλείσιμο
        </button>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          onClick={() => {
            refetch();
            setShowFilters(false);
          }}
        >
          Εφαρμογή Φίλτρων
        </button>
      </div>
    </div>
  ), [filters, handleFilterChange, refetch, resetFilters]);
  
  // Grid View
  const renderGridView = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 group"
        >
          <div className="flex justify-between items-start mb-3">
            <Link
              href={`/ftthbphase/malfunctions/${record.id}`}
              className="text-lg font-bold text-blue-600 hover:underline group-hover:text-blue-700 transition-colors"
              aria-label={`View details for malfunction ${record.name}`}
            >
              {record.name}
            </Link>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status || "")}`}
            >
              {record.status}
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900">ID Βλάβης: {record.idvlavis || "N/A"}</p>
              </div>
            </div>
            
            {record.customername && (
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">{record.customername}</p>
                  {record.customermobile && (
                    <p className="text-gray-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> 
                      {record.customermobile}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-gray-900">{record.address || "N/A"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-gray-500 flex-shrink-0" />
              <p className="text-gray-600">{formatDate(record.datecreated || record.createdAt)}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {record.ak && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  AK: {record.ak}
                </span>
              )}
              {record.ttlp && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  TTLP: {record.ttlp}
                </span>
              )}
              {record.blowingDone && (
                <span className="inline-flex items-center px-2 py-1 bg-blue-50 rounded text-xs font-medium text-blue-700">
                  Εμφύσηση: {record.blowingDone}
                </span>
              )}
            </div>
            
            {record.jobdescription && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-lg text-xs text-yellow-800 border border-yellow-100">
                <p className="font-medium mb-0.5">Περιγραφή:</p>
                <p className="line-clamp-2">{record.jobdescription}</p>
              </div>
            )}
          </div>
          
          {record.assignedUserName && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Ανατέθηκε στον {record.assignedUserName}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  ), [records, getStatusColor, formatDate]);
  
  // List View
  const renderListView = useMemo(() => (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-medium text-gray-700">Κατάσταση</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Αριθμός</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">ID Βλάβης</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Διεύθυνση</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">ΑΚ</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">TTLP</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Ημερομηνία</th>
            <th className="px-4 py-3 text-left font-medium text-gray-700">Τεχνικός</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(record.status)}
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status || "")}`}
                  >
                    {record.status}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3.5">
                <Link
                  href={`/ftthbphase/malfunctions/${record.id}`}
                  className="text-blue-600 hover:underline font-medium"
                  aria-label={`View details for malfunction ${record.name}`}
                >
                  {record.name}
                </Link>
              </td>
              <td className="px-4 py-3.5 text-gray-900">{record.idvlavis || "—"}</td>
              <td className="px-4 py-3.5">
                <div className="text-gray-900">{record.address || "—"}</div>
                {record.customername && (
                  <div className="text-gray-600 text-xs">{record.customername}</div>
                )}
              </td>
              <td className="px-4 py-3.5 text-gray-900">{record.ak || "—"}</td>
              <td className="px-4 py-3.5 text-gray-900">{record.ttlp || "—"}</td>
              <td className="px-4 py-3.5 text-gray-600">{formatDate(record.datecreated || record.createdAt)}</td>
              <td className="px-4 py-3.5 text-gray-900">{record.assignedUserName || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ), [records, getStatusColor, getStatusIcon, formatDate]);

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto px-4 space-y-6">
        <Breadcrumb pageName="Βλάβες" />
        
        {/* Stats Section */}
        {renderStats}
        
        <div className="rounded-xl border bg-white shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Λίστα Βλαβών</h1>
                <p className="text-gray-500 mt-1">
                  {totalRecords > 0 ? 
                    `Προβολή ${Math.min(ITEMS_PER_PAGE * (currentPage - 1) + 1, totalRecords)} έως ${Math.min(currentPage * ITEMS_PER_PAGE, totalRecords)} από ${totalRecords} αποτελέσματα` : 
                    'Δεν βρέθηκαν αποτελέσματα'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Link 
                  href="/ftthbphase/malfunctions/new" 
                  className="px-4 py-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Νέα Βλάβη</span>
                </Link>
              </div>
            </div>
            
            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* View Toggle - Enhanced with better contrast */}
              <div className="flex items-center gap-2 border rounded-lg p-1.5 bg-gray-50">
                <button
                  onClick={() => setView("grid")}
                  className={`p-2 rounded-md text-sm font-medium transition-all ${
                    view === "grid" 
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  aria-label="Switch to grid view"
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`p-2 rounded-md text-sm font-medium transition-all ${
                    view === "list" 
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-gray-200" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  aria-label="Switch to list view"
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
              
              {/* Sort Button */}
              <div className="relative">
                <button
                  onClick={() => setShowSortOptions(!showSortOptions)}
                  onBlur={() => setTimeout(() => setShowSortOptions(false), 200)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                    sortConfig.field !== "createdAt" || sortConfig.direction !== "desc"
                      ? "border-blue-300 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                  } transition-colors`}
                  aria-label="Toggle sort options"
                >
                  <ArrowUpDown className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Ταξινόμηση
                    {(sortConfig.field !== "createdAt" || sortConfig.direction !== "desc") && 
                      <span className="ml-1">•</span>
                    }
                  </span>
                </button>
                {SortOptionsPopup()}
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  Object.values(filters).some(v => v !== "")
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                } transition-colors`}
                aria-label="Toggle filters"
              >
                <Filter className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Φίλτρα 
                  {Object.values(filters).some(v => v !== "") && 
                    <span className="ml-1">•</span>
                  }
                </span>
              </button>
              
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Αναζήτηση ID, διεύθυνσης ή πελάτη..."
                  defaultValue={searchTerm}
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
                  aria-label="Search malfunctions"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCurrentPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                aria-label="Refresh data"
                title="Ανανέωση δεδομένων"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
            </div>
            
            {/* Filter Panel */}
            {showFilters && renderFilters}
            
            {/* Content */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Φόρτωση δεδομένων...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center py-16 text-red-500 gap-3">
                <AlertCircle className="h-12 w-12" />
                <span className="text-lg font-medium">
                  Σφάλμα κατά τη φόρτωση δεδομένων
                </span>
                <button
                  onClick={() => refetch()}
                  className="mt-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Δοκιμάστε ξανά
                </button>
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold mb-2">Δεν βρέθηκαν εγγραφές</h3>
                <p className="text-gray-600 mb-4">Δοκιμάστε να αλλάξετε τα φίλτρα ή την αναζήτηση</p>
                {(Object.values(filters).some(v => v !== "") || searchTerm) && (
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    <span>Επαναφορά φίλτρων</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {view === "grid" ? renderGridView : renderListView}
                
                {/* Pagination */}
                {records.length > 0 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={Math.ceil(totalRecords / ITEMS_PER_PAGE)}
                      onPageChange={setCurrentPage}
                      totalRecords={totalRecords}
                      itemsPerPage={ITEMS_PER_PAGE}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}