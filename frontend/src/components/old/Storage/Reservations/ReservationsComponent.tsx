"use client";

import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import { 
  Download, 
  Search, 
  Package, 
  Calendar, 
  RefreshCcw,
  X,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  name?: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  location?: string;
}

interface Reservation {
  id: number;
  user: User;
  product: Product;
  reserved_at: string;
  return_date: string | null;
}

interface ReservationsComponentProps {
  isAdmin?: boolean;
}

const ReservationsComponent: React.FC<ReservationsComponentProps> = ({ isAdmin = false }) => {
  // Κρατάμε τις κρατήσεις και το loading state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<number[]>([]);
  
  // Παγίδευση κρατήσεων από το API
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const response = await warehouseService.getReservations();
        
        // Αν η απάντηση δεν είναι array, μετατρέπουμε σε []
        setReservations(Array.isArray(response) ? response : response?.data || []);
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Αποτυχία λήψης κρατήσεων');
      } finally {
        setLoading(false);
      }
    };
  
    fetchReservations();
  }, []);
  

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Κρατήσεις</h2>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-4 px-6 py-3">
                  <input
                    type="checkbox"
                    checked={selectedReservations.length === reservations.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedReservations(reservations.map(r => r.id));
                      } else {
                        setSelectedReservations([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Χρήστης
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Λεπτομέρειες Προϊόντος
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ημερομηνία Κράτησης
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Κατάσταση
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-4 text-center text-gray-500">
                    Δεν βρέθηκαν κρατήσεις
                  </td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="w-4 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReservations.includes(reservation.id)}
                        onChange={() => {
                          setSelectedReservations(prev => 
                            prev.includes(reservation.id)
                              ? prev.filter(id => id !== reservation.id)
                              : [...prev, reservation.id]
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.user.username}
                            </div>
                            {reservation.user.name && (
                              <div className="text-sm text-gray-500">
                                {reservation.user.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {reservation.product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {reservation.product.sku}
                        </div>
                        {reservation.product.location && (
                          <div className="text-sm text-gray-500">
                            Τοποθεσία: {reservation.product.location}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(reservation.reserved_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        reservation.return_date
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {reservation.return_date ? 'Επιστράφηκε' : 'Ενεργή'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReservationsComponent;