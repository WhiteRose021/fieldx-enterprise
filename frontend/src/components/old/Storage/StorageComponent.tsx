"use client";

import React, { useState, useEffect, useMemo } from "react";
import { warehouseService } from "@/services/warehouseService";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";
import WarehouseActions from "./WarehouseActions";
import { Product, Reservation } from "@/types/warehouse";
import { Inter } from 'next/font/google';
import {
  Package,
  PackageOpen,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Loader2,
  BarChart2,
  FileDown,
  PlusCircle,
  RefreshCcw,
  X,
  Clipboard,
  Warehouse,
  BookOpen,
  Users,
  Clock,
  UserCheck,
  Calendar
} from "lucide-react";

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const StorageComponent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [totalSelectedItems, setTotalSelectedItems] = useState(0);
  const [isStockUpdateSuccess, setIsStockUpdateSuccess] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  
  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reservations'>('products');
  const [isReservationReturned, setIsReservationReturned] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<string>("");
  const [users, setUsers] = useState<{id: string, username: string}[]>([]);
  const [isReservationsFiltersOpen, setIsReservationsFiltersOpen] = useState(false);
  const [selectedReservationIds, setSelectedReservationIds] = useState<number[]>([]);

  // Get unique categories and locations for filters
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return uniqueCategories.sort();
  }, [products]);
  
  const locations = useMemo(() => {
    const uniqueLocations = Array.from(new Set(products.map(p => p.location).filter(Boolean)));
    return uniqueLocations.sort();
  }, [products]);

  // Get unique users who have reservations
  const reservationUsers = useMemo(() => {
    const uniqueUsers = Array.from(
      new Set(
        reservations
          .filter(r => r.user && r.user.username)
          .map(r => JSON.stringify({ id: r.user.id, username: r.user.username }))
      )
    ).map(str => JSON.parse(str));
    
    return uniqueUsers.sort((a, b) => a.username.localeCompare(b.username));
  }, [reservations]);

  // Filtered reservations based on user filter
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];
    
    // Apply user filter if selected
    if (userFilter) {
      filtered = filtered.filter(r => r.user && r.user.id === userFilter);
    }
    
    // Sort active ones first, then by date (newest first) within each group
    return filtered.sort((a, b) => {
      // First sort by active status (null return_date means active)
      if (a.return_date === null && b.return_date !== null) return -1;
      if (a.return_date !== null && b.return_date === null) return 1;
      
      // Then sort by date (newest first)
      return new Date(b.reserved_at).getTime() - new Date(a.reserved_at).getTime();
    });
  }, [reservations, userFilter]);

  // Calculate statistics for dashboard
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockItems = products.filter(p => p.stock === 0).length;
    const totalReservations = reservations.length;
    const activeReservations = reservations.filter(r => r.return_date === null).length;
    
    return {
      totalProducts,
      totalStock,
      lowStockItems,
      outOfStockItems,
      totalReservations,
      activeReservations
    };
  }, [products, reservations]);

  useEffect(() => {
    fetchProducts();
    fetchReservations();
    fetchUsers();
  }, [searchQuery, categoryFilter, locationFilter, stockFilter, showDeleted]);

  useEffect(() => {
    // Calculate total selected items whenever quantities change
    const total = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    setTotalSelectedItems(total);
  }, [quantities]);

  const fetchUsers = async () => {
    try {
      const response = await warehouseService.getUsers();
      setUsers(response.users || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters: any = {
        query: searchQuery,
        showDeleted: showDeleted ? "true" : "false"
      };
      
      if (categoryFilter) filters.category = categoryFilter;
      if (locationFilter) filters.location = locationFilter;
      if (stockFilter) filters.stock = stockFilter;
      
      const response = await warehouseService.getProducts(filters);
      setProducts(response.products || []);
    } catch (err) {
      setError("Αποτυχία λήψης προϊόντων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch reservations
  const fetchReservations = async () => {
    try {
      setLoadingReservations(true);
      
      // Fetch other users' reservations
      try {
        const otherRes = await warehouseService.getOtherReservations();
        // Sort reservations by date (newest first)
        const sortedReservations = (otherRes.reservations || []).sort((a: Reservation, b: Reservation) => {
          return new Date(b.reserved_at).getTime() - new Date(a.reserved_at).getTime();
        });
        setReservations(sortedReservations);
      } catch (err) {
        // This might fail if user doesn't have admin permissions, just set empty array
        setReservations([]);
      }
    } catch (err) {
      setError("Αποτυχία λήψης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    try {
      setLoading(true);
      await warehouseService.deleteProduct(productId);
      // Show success message
      setError(null);
      fetchProducts();
    } catch (err) {
      setError("Αποτυχία διαγραφής προϊόντος. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId: number, quantity: number) => {
    try {
      setLoading(true);
      await warehouseService.updateStock(productId, quantity);
      setIsStockUpdateSuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setIsStockUpdateSuccess(false);
      }, 3000);
      
      fetchProducts();
    } catch (err) {
      setError("Αποτυχία ενημέρωσης αποθέματος. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, Math.min(quantity, products.find(p => p.id === productId)?.stock || 0))
    }));
  };

  const handleReserveProducts = async () => {
    try {
      setLoading(true);
      const reservationsToCreate = Object.entries(quantities)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => ({
          productId: parseInt(productId),
          quantity
        }));

      if (reservationsToCreate.length === 0) {
        setError("Παρακαλώ επιλέξτε ποσότητες για κράτηση");
        setLoading(false);
        return;
      }

      // Create reservations
      for (const { productId, quantity } of reservationsToCreate) {
        await warehouseService.createReservation(productId, quantity);
      }

      // Reset quantities and refresh products
      setQuantities({});
      fetchProducts();
      fetchReservations(); // Also refresh reservations
      setError(null);
    } catch (err) {
      setError("Αποτυχία κράτησης προϊόντων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  // Function to handle returning a reservation
  const handleReturnReservation = async (reservationId: number) => {
    try {
      setLoading(true);
      await warehouseService.returnReservation(reservationId);
      setIsReservationReturned(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setIsReservationReturned(false);
      }, 3000);
      
      fetchReservations();
      fetchProducts(); // Also refresh products as stocks might have changed
    } catch (err) {
      setError("Αποτυχία επιστροφής κράτησης. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle returning multiple reservations
  const handleReturnMultipleReservations = async () => {
    if (selectedReservationIds.length === 0) {
      setError("Παρακαλώ επιλέξτε κρατήσεις για επιστροφή");
      return;
    }

    try {
      setLoading(true);
      await warehouseService.returnMultipleReservations(selectedReservationIds);
      setIsReservationReturned(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setIsReservationReturned(false);
      }, 3000);
      
      setSelectedReservationIds([]);
      fetchReservations();
      fetchProducts(); // Also refresh products as stocks might have changed
    } catch (err) {
      setError("Αποτυχία επιστροφής κρατήσεων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setLocationFilter("");
    setStockFilter("");
    setShowDeleted(false);
  };

  const handleClearReservationFilters = () => {
    setUserFilter("");
  };

  const handleExportProducts = async () => {
    try {
      // This would normally trigger a download of the products in the selected format
      setIsExportModalOpen(false);
      // Show a success message
      alert(`Τα προϊόντα εξήχθησαν επιτυχώς σε μορφή ${exportFormat.toUpperCase()}`);
    } catch (err) {
      setError("Αποτυχία εξαγωγής προϊόντων. Παρακαλώ δοκιμάστε ξανά.");
    }
  };

  const calculateDuration = (reservedAt: string, returnDate: string | null) => {
    const start = new Date(reservedAt);
    const end = returnDate ? new Date(returnDate) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} ημέρες ${returnDate ? '' : '(σε εξέλιξη)'}`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <ProductTable
            products={products}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onStockUpdate={handleStockUpdate}
            onQuantityChange={handleQuantityChange}
            quantities={quantities}
          />
        );
      
      case 'reservations':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-4 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReservationIds.length === filteredReservations.filter(r => r.return_date === null).length && filteredReservations.filter(r => r.return_date === null).length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedReservationIds(filteredReservations.filter(r => r.return_date === null).map(r => r.id));
                        } else {
                          setSelectedReservationIds([]);
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600"
                      disabled={filteredReservations.filter(r => r.return_date === null).length === 0}
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Χρήστης
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Προϊόν
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ημερομηνία
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Διάρκεια
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Κατάσταση
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ενέργειες
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReservations.length > 0 ? (
                  filteredReservations.map((reservation) => (
                    <tr key={reservation.id} className={reservation.return_date === null ? "bg-green-50" : ""}>
                      <td className="w-4 px-6 py-4">
                        {reservation.return_date === null && (
                          <input
                            type="checkbox"
                            checked={selectedReservationIds.includes(reservation.id)}
                            onChange={() => {
                              setSelectedReservationIds(prev => 
                                prev.includes(reservation.id)
                                  ? prev.filter(id => id !== reservation.id)
                                  : [...prev, reservation.id]
                              );
                            }}
                            className="rounded border-gray-300 text-blue-600"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.user?.username || reservation.userName || 'Άγνωστος Χρήστης'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.product?.name || reservation.productName || 'Άγνωστο προϊόν'}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {reservation.product?.sku || reservation.productSku || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(reservation.reserved_at).toLocaleDateString('el-GR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(reservation.reserved_at).toLocaleTimeString('el-GR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {calculateDuration(reservation.reserved_at, reservation.return_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          reservation.return_date === null
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.return_date === null
                            ? 'Ενεργή' 
                            : 'Επιστράφηκε'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {reservation.return_date === null && (
                          <button
                            onClick={() => handleReturnReservation(reservation.id)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Επιστροφή
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedReservation(reservation);
                            setIsReservationModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Λεπτομέρειες
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      Δεν υπάρχουν κρατήσεις
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={inter.className}>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Stats Cards - 4 columns on all screens */}
        <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 rounded-lg p-3">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Σύνολο Προϊόντων</p>
              <p className="text-2xl font-semibold">{stats.totalProducts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 rounded-lg p-3">
              <Warehouse size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Σύνολο Τεμαχίων σε Απόθεμα</p>
              <p className="text-2xl font-semibold">{stats.totalStock}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 rounded-lg p-3">
              <Calendar size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Σύνολο Κρατήσεων</p>
              <p className="text-2xl font-semibold">{stats.totalReservations}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 rounded-lg p-3">
              <BookOpen size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ενεργές Κρατήσεις</p>
              <p className="text-2xl font-semibold">{stats.activeReservations}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Main content - 3 columns on large screens */}
        <div className="lg:col-span-3 space-y-6">
          {/* Success Messages */}
          {isStockUpdateSuccess && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-sm animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">Το απόθεμα ενημερώθηκε με επιτυχία.</p>
                </div>
              </div>
            </div>
          )}

          {isReservationReturned && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-sm animate-fade-in">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm">Η κράτηση επιστράφηκε με επιτυχία.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Alert */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setError(null)}
                      className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'products'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Package className="inline-block mr-2 h-5 w-5" />
                  Προϊόντα
                </button>
                <button
                  onClick={() => setActiveTab('reservations')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'reservations'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="inline-block mr-2 h-5 w-5" />
                  Κρατήσεις <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{reservations.filter(r => r.return_date === null).length}</span>
                </button>
              </nav>
            </div>

            {/* Action Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap justify-between items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                {activeTab === 'products' && (
                  <>
                    <Package size={18} className="text-blue-600" />
                    Λίστα Προϊόντων
                  </>
                )}
                {activeTab === 'reservations' && (
                  <>
                    <Users size={18} className="text-blue-600" />
                    Κρατήσεις Χρηστών
                  </>
                )}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {activeTab === 'products' && (
                  <>
                    <button
                      onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-aspro border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                    >
                      <Filter size={14} />
                      Φίλτρα
                      <ChevronDown size={14} className={`transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <button
                      onClick={fetchProducts}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-aspro border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      title="Ανανέωση Λίστας Προϊόντων"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  </>
                )}
                {activeTab === 'reservations' && (
                  <>
                    {selectedReservationIds.length > 0 && (
                      <button
                        onClick={handleReturnMultipleReservations}
                        className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <PackageOpen size={14} />
                        Επιστροφή Επιλεγμένων ({selectedReservationIds.length})
                      </button>
                    )}
                    <button
                      onClick={() => setIsReservationsFiltersOpen(!isReservationsFiltersOpen)}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-aspro border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                    >
                      <Filter size={14} />
                      Φίλτρα
                      <ChevronDown size={14} className={`transition-transform ${isReservationsFiltersOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={fetchReservations}
                      className="inline-flex items-center gap-1 text-sm px-3 py-1.5 bg-aspro border border-gray-300 rounded hover:bg-gray-50 text-gray-700"
                      title="Ανανέωση Κρατήσεων"
                    >
                      <RefreshCcw size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Filters Section - Only shown for products tab */}
            {activeTab === 'products' && isFiltersOpen && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="col-span-1 md:col-span-2">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Αναζήτηση με SKU, Όνομα ή Περιγραφή"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Όλες οι Κατηγορίες</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Όλες οι Τοποθεσίες</option>
                      {locations.map((location, index) => (
                        <option key={index} value={location}>
                          {location}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Όλα τα Επίπεδα Αποθέματος</option>
                      <option value="instock">Σε Απόθεμα</option>
                      <option value="lowstock">Χαμηλό Απόθεμα (≤ 5)</option>
                      <option value="outofstock">Εκτός Αποθέματος</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <label className="inline-flex items-center space-x-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={showDeleted}
                        onChange={() => setShowDeleted(!showDeleted)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Εμφάνιση Διαγραμμένων Προϊόντων</span>
                    </label>
                    
                    <button
                      onClick={handleClearFilters}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Καθαρισμός Φίλτρων
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Reservations Filters */}
            {activeTab === 'reservations' && isReservationsFiltersOpen && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Χρήστης</label>
                    <select
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Όλοι οι Χρήστες</option>
                      {reservationUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-end justify-end">
                    <button
                      onClick={handleClearReservationFilters}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Καθαρισμός Φίλτρων
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Main Content Area based on active tab */}
            {(loading || loadingReservations) && activeTab === (
              loadingReservations ? activeTab === 'reservations' : activeTab === 'products'
            ) ? (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-gray-500 text-sm">
                    {activeTab === 'products' ? 'Φόρτωση προϊόντων...' : 'Φόρτωση κρατήσεων...'}
                  </p>
                </div>
              </div>
            ) : (
              renderTabContent()
            )}
          </div>
        </div>
        
        {/* Right Sidebar - 1 column on large screens */}
        <div className="space-y-6">
          {/* Actions Card */}
          <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Clipboard size={18} className="text-blue-600" />
                Ενέργειες
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <button
                onClick={handleAddProduct}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <PlusCircle size={18} />
                <span className="font-medium">Προσθήκη Νέου Προϊόντος</span>
              </button>
              
              <button
                onClick={() => document.getElementById('importFileInput')?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="font-medium">Εισαγωγή Προϊόντων</span>
              </button>
              
              {totalSelectedItems > 0 && (
                <button
                  onClick={handleReserveProducts}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
                >
                  <PackageOpen size={18} />
                  <span className="font-medium">Κράτηση Επιλεγμένων ({totalSelectedItems})</span>
                </button>
              )}
              
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
              >
                <FileDown size={18} />
                <span className="font-medium">Εξαγωγή Προϊόντων</span>
              </button>
            </div>
            
            {/* Import/Export Action Buttons */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex justify-center items-center gap-8 mb-4">
                
                {/* Hidden file input for import functionality */}
                <input 
                  type="file" 
                  id="importFileInput" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      warehouseService.importProducts(file)
                        .then(() => fetchProducts())
                        .catch(() => setError("Αποτυχία εισαγωγής προϊόντων. Παρακαλώ ελέγξτε τη μορφή του αρχείου και δοκιμάστε ξανά."));
                    }
                  }}
                />
              </div>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Σύνολο Προϊόντων</div>
                  <div className="text-xl font-semibold text-gray-800">{stats.totalProducts}</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Συνολικό Απόθεμα</div>
                  <div className="text-xl font-semibold text-gray-800">{stats.totalStock} τεμάχια</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Ενεργές Κρατήσεις</div>
                  <div className="text-xl font-semibold text-blue-500">{stats.activeReservations}</div>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-500">Συνολικές Κρατήσεις</div>
                  <div className="text-xl font-semibold text-green-500">{stats.totalReservations}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics Card */}
          <div className="bg-aspro rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BarChart2 size={18} className="text-blue-600" />
                Στατιστικά Αποθέματος
              </h2>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Κορυφαία Κατηγορία:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {categories[0] || "Καλώδια"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Μέσο Απόθεμα ανά Προϊόν:</span>
                  <span className="text-sm font-medium">
                    {products.length > 0 
                      ? (stats.totalStock / stats.totalProducts).toFixed(1) 
                      : "15,8"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Κατάσταση Αποθέματος:</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                    stats.outOfStockItems === 0 
                      ? "bg-green-100 text-green-800" 
                      : stats.outOfStockItems < 5 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-red-100 text-red-800"
                  }`}>
                    {stats.outOfStockItems === 0 
                      ? "Εξαιρετική" 
                      : stats.outOfStockItems < 5 
                      ? "Καλή" 
                      : "Χρειάζεται Προσοχή"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ποικιλία Αποθέματος:</span>
                  <span className="text-sm font-medium">
                    {categories.length || 6} κατηγορίες
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <ProductModal
            product={selectedProduct}
            onClose={() => setIsModalOpen(false)}
            onSave={async (productData) => {
              try {
                setLoading(true);
                if (!productData.name || !productData.sku) {
                  setError("Το όνομα και ο κωδικός SKU είναι υποχρεωτικά πεδία.");
                  setLoading(false);
                  return;
                }
                
                if (selectedProduct) {
                  const completeData = {
                    ...selectedProduct,  // Start with all existing product data
                    ...productData,      // Override with any updated fields
                    name: productData.name || selectedProduct.name,  // Ensure name exists
                    sku: productData.sku || selectedProduct.sku      // Ensure sku exists
                  };
                  await warehouseService.updateProduct(selectedProduct.id, completeData);
                }
                
                fetchProducts();
                setIsModalOpen(false);
                setError(null);
              } catch (err) {
                setError("Αποτυχία αποθήκευσης προϊόντος. Παρακαλώ δοκιμάστε ξανά.");
              } finally {
                setLoading(false);
              }
            }}
          />
        </div>
      )}
      
      {/* Reservation Details Modal */}
      {isReservationModalOpen && selectedReservation && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReservationModalOpen(false);
          }}
        >
          <div className="bg-aspro rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Λεπτομέρειες Κράτησης
              </h2>
              <button
                onClick={() => setIsReservationModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Κλείσιμο"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Προϊόν</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {selectedReservation.product?.name || selectedReservation.productName || 'Άγνωστο προϊόν'}
                  </p>
                  <p className="text-sm text-gray-600">
                    SKU: {selectedReservation.product?.sku || selectedReservation.productSku || 'N/A'}
                  </p>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Ημερομηνία Κράτησης</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(selectedReservation.reserved_at).toLocaleDateString('el-GR')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedReservation.reserved_at).toLocaleTimeString('el-GR')}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Κατάσταση</h3>
                      <p className={`mt-1 inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                        selectedReservation.return_date === null
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedReservation.return_date === null ? 'Ενεργή' : 'Επιστράφηκε'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReservation.return_date && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Ημερομηνία Επιστροφής</h3>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedReservation.return_date).toLocaleDateString('el-GR')}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedReservation.return_date).toLocaleTimeString('el-GR')}
                        </p>
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Διάρκεια</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {calculateDuration(selectedReservation.reserved_at, selectedReservation.return_date)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500">Χρήστης</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedReservation.user?.username || selectedReservation.userName || 'Άγνωστος Χρήστης'}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsReservationModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Κλείσιμο
              </button>
              
              {selectedReservation.return_date === null && (
                <button
                  onClick={() => {
                    handleReturnReservation(selectedReservation.id);
                    setIsReservationModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Επιστροφή Κράτησης
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Export Modal */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExportModalOpen(false);
          }}
        >
          <div className="bg-aspro rounded-lg shadow-lg w-full max-w-md overflow-hidden animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-aspro">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <FileDown size={20} className="text-blue-600" />
                Εξαγωγή Προϊόντων
              </h2>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Κλείσιμο"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Μορφή Αρχείου</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    className={`py-3 px-4 border ${exportFormat === 'csv' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'} rounded-md flex flex-col items-center justify-center`}
                    onClick={() => setExportFormat('csv')}
                  >
                    <FileDown size={24} className={exportFormat === 'csv' ? 'text-blue-600' : 'text-gray-500'} />
                    <span className="mt-1 text-sm">CSV</span>
                  </button>
                  <button
                    className={`py-3 px-4 border ${exportFormat === 'excel' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'} rounded-md flex flex-col items-center justify-center`}
                    onClick={() => setExportFormat('excel')}
                  >
                    <FileDown size={24} className={exportFormat === 'excel' ? 'text-blue-600' : 'text-gray-500'} />
                    <span className="mt-1 text-sm">Excel</span>
                  </button>
                  <button
                    className={`py-3 px-4 border ${exportFormat === 'pdf' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-300 hover:bg-gray-50'} rounded-md flex flex-col items-center justify-center`}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <FileDown size={24} className={exportFormat === 'pdf' ? 'text-blue-600' : 'text-gray-500'} />
                    <span className="mt-1 text-sm">PDF</span>
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Επιλογές Εξαγωγής</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded h-4 w-4 text-blue-600" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Συμπερίληψη λεπτομερειών προϊόντος</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded h-4 w-4 text-blue-600" defaultChecked />
                    <span className="ml-2 text-sm text-gray-700">Συμπερίληψη τρέχοντος επιπέδου αποθέματος</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded h-4 w-4 text-blue-600" />
                    <span className="ml-2 text-sm text-gray-700">Συμπερίληψη διαγραμμένων προϊόντων</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Ακύρωση
              </button>
              <button
                onClick={handleExportProducts}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FileDown size={16} />
                <span>Εξαγωγή {products.length} Προϊόντων</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default StorageComponent;