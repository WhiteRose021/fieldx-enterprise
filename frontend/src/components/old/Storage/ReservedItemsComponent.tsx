import React, { useState, useEffect } from 'react';
import { warehouseService } from "@/services/warehouseService";
import { Reservation, Product } from '@/types/warehouse';
import { 
  ShoppingCart, 
  X, 
  User, 
  Calendar, 
  Package, 
  RefreshCcw, 
  ArrowLeft,
  ChevronRight,
  CornerDownLeft,
  Search,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';

interface ReservedItemsComponentProps {
  onBack?: () => void;
  showBackButton?: boolean;
}

const ReservedItemsComponent: React.FC<ReservedItemsComponentProps> = ({ 
  onBack, 
  showBackButton = false 
}) => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [products, setProducts] = useState<{[key: number]: Product}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await warehouseService.getReservations();
      const reservationsData = response.reservations || [];
      setReservations(reservationsData);
      
      // Fetch product details for each reservation
      const productIds = Array.from(new Set(reservationsData.map((r: { productId: any; }) => r.productId))) as number[];
      const productDetails: {[key: number]: Product} = {};
      
      for (const productId of productIds) {
        try {
          const productData = await warehouseService.getProduct(productId);
          productDetails[productId] = productData.product;
        } catch (err) {
          console.error(`Failed to fetch product ${productId}:`, err);
        }
      }
      
      setProducts(productDetails);
    } catch (err) {
      setError('Αποτυχία λήψης κρατήσεων. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnItem = async (reservationId: number) => {
    try {
      setLoading(true);
      await warehouseService.returnReservation(reservationId);
      fetchReservations();
    } catch (err) {
      setError('Αποτυχία επιστροφής αντικειμένου. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setLoading(false);
    }
  };

  // Filter reservations based on search query
  const filteredReservations = reservations.filter(reservation => {
    if (!searchQuery.trim()) return true;
    
    const product = products[reservation.productId];
    if (!product) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      (product.category && product.category.toLowerCase().includes(query))
    );
  });

  // Group reservations by status
  const groupedReservations = filteredReservations.reduce((groups, reservation) => {
    const status = reservation.status || 'pending';
    if (!groups[status]) groups[status] = [];
    groups[status].push(reservation);
    return groups;
  }, {} as Record<string, Reservation[]>);

  // Translate status labels
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'Εκκρεμείς';
      case 'confirmed': return 'Επιβεβαιωμένες';
      case 'cancelled': return 'Ακυρωμένες';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-3 text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Δεσμευμένα Αντικείμενα</h2>
          </div>
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button
                onClick={onBack}
                className="p-1 hover:bg-purple-700 rounded-full transition-colors"
                title="Επιστροφή στα Προϊόντα"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={fetchReservations}
              className="p-1 hover:bg-purple-700 rounded-full transition-colors"
              title="Ανανέωση Κρατήσεων"
            >
              <RefreshCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Αναζήτηση με όνομα προϊόντος, SKU ή κατηγορία"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700"></div>
            <p className="mt-3 text-gray-600">Φόρτωση κρατήσεων...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 max-w-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Σφάλμα φόρτωσης κρατήσεων</h3>
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchReservations}
                  className="mt-2 text-sm text-red-700 hover:text-red-900 font-medium flex items-center"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" />
                  Δοκιμάστε Ξανά
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <ShoppingBag className="h-12 w-12 text-gray-400 mb-3" />
          {searchQuery ? (
            <>
              <h3 className="text-lg font-medium text-gray-700">Δεν βρέθηκαν αντίστοιχες κρατήσεις</h3>
              <p className="text-gray-500 mt-1">Δοκιμάστε να προσαρμόσετε την αναζήτησή σας.</p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-700">Δεν υπάρχουν δεσμευμένα αντικείμενα</h3>
              <p className="text-gray-500 mt-1">Δεσμεύστε προϊόντα από τη σελίδα αποθέματος.</p>
            </>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {Object.entries(groupedReservations).map(([status, statusReservations]) => (
            <div key={status} className="p-4">
              <h3 className="text-base font-medium text-gray-800 mb-3 flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${
                  status === 'confirmed' 
                    ? 'bg-green-500' 
                    : status === 'cancelled' 
                    ? 'bg-red-500' 
                    : 'bg-yellow-500'
                }`}></span>
                {translateStatus(status)} Κρατήσεις ({statusReservations.length})
              </h3>
              
              <div className="space-y-3">
                {statusReservations.map(reservation => {
                  const product = products[reservation.productId] || { name: 'Άγνωστο Προϊόν', sku: 'N/A' };
                  
                  return (
                    <div key={reservation.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-md">
                          <Package className="h-6 w-6 text-purple-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="text-base font-medium text-gray-900">{product.name}</h4>
                              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                            </div>
                            <div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Ποσ: {reservation.quantity}
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              Δεσμεύτηκε: {new Date(reservation.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <User className="h-3.5 w-3.5 mr-1" />
                              Δεσμεύτηκε από: Εσάς
                            </div>
                          </div>
                          
                          {status === 'pending' || status === 'confirmed' ? (
                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => handleReturnItem(reservation.id)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                              >
                                <CornerDownLeft className="h-3.5 w-3.5 mr-1" />
                                Επιστροφή Αντικειμένου
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer with navigation */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {filteredReservations.length} {filteredReservations.length === 1 ? 'κράτηση' : 'κρατήσεις'} βρέθηκαν
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center px-3 py-1.5 text-sm rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Επιστροφή στα Προϊόντα
        </button>
      </div>
    </div>
  );
};

export default ReservedItemsComponent;