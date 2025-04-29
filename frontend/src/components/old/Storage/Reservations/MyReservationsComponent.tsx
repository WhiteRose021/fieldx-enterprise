// components/Reservations/MyReservations.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import { Download, Search, Package, Calendar, RefreshCcw } from 'lucide-react';

interface Reservation {
  id: number;
  user: {
    id: string;
    username: string;
  };
  product: {
    id: number;
    name: string;
    sku: string;
  };
  reserved_at: string;
  return_date: string | null;
}

const MyReservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<number[]>([]);
  
  // Filters
  const [status, setStatus] = useState<'active' | 'returned' | 'all'>('active');
  const [dateFilter, setDateFilter] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    fetchReservations();
  }, [status, dateFilter, sortOrder]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await warehouseService.getReservations();
      setReservations(response.reservations);
      setLoading(false);
    } catch (err) {
      setError('Αποτυχία λήψης κρατήσεων');
      setLoading(false);
    }
  };

  const handleReturnReservation = async (reservationId: number) => {
    try {
      await warehouseService.returnReservation(reservationId);
      fetchReservations();
    } catch (err) {
      setError('Αποτυχία επιστροφής αντικειμένου');
    }
  };

  const calculateDuration = (reservedAt: string, returnDate: string | null) => {
    const start = new Date(reservedAt);
    const end = returnDate ? new Date(returnDate) : new Date();
    const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} ημέρες ${returnDate ? '' : '(σε εξέλιξη)'}`;
  };

  const stats = {
    total: reservations.length,
    active: reservations.filter(r => !r.return_date).length,
    returned: reservations.filter(r => r.return_date).length
  };

  return (
    <div>
      {/* Header with stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Συνολικές Κρατήσεις</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Ενεργές Κρατήσεις</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <RefreshCcw className="w-10 h-10 text-gray-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Επιστραφέντα Είδη</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.returned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Κατάσταση</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'returned' | 'all')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="active">Ενεργές</option>
                <option value="returned">Επιστραφέντα</option>
                <option value="all">Όλα</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ημερομηνία</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ταξινόμηση κατά</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="newest">Νεότερα πρώτα</option>
                <option value="oldest">Παλαιότερα πρώτα</option>
              </select>
            </div>

            <div className="flex items-end">
              <button 
                onClick={() => fetchReservations()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <Search className="w-4 h-4 inline-block mr-2" />
                Αναζήτηση
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Κρατήσεις</h2>
          <button
            onClick={() => {}} // TODO: Implement export
            className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Εξαγωγή
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Προϊόν
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ημερομηνία Κράτησης
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Διάρκεια
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Κατάσταση
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ενέργειες
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Δεν βρέθηκαν κρατήσεις
                  </td>
                </tr>
              ) : (
                reservations.map((reservation) => (
                  <tr key={reservation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{reservation.product.name}</div>
                        <div className="text-sm text-gray-500">SKU: {reservation.product.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(reservation.reserved_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {calculateDuration(reservation.reserved_at, reservation.return_date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        reservation.return_date
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {reservation.return_date ? 'Επιστράφηκε' : 'Ενεργή'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {!reservation.return_date && (
                        <button
                          onClick={() => handleReturnReservation(reservation.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Επιστροφή Αντικειμένου
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}
    </div>
  );
};

export default MyReservations;