"use client";

import React, { useState, useEffect } from 'react';
import { warehouseService } from '@/services/warehouseService';
import { User, UserPlus, Search, Clock, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface WarehouseUser {
  id: string;
  username: string;
  name?: string;
  role: string;
  last_login?: string;
  active_reservations: number;
  total_reservations: number;
}

const UsersComponent = () => {
  const [users, setUsers] = useState<WarehouseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'username' | 'last_login' | 'reservations'>('username');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await warehouseService.getUsers();
      setUsers(response.users);
      setLoading(false);
    } catch (err) {
      setError('Αποτυχία λήψης χρηστών');
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter(user => {
      if (searchQuery && !user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !user.name?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (roleFilter !== 'all' && user.role !== roleFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'last_login':
          return (b.last_login || '').localeCompare(a.last_login || '');
        case 'reservations':
          return b.active_reservations - a.active_reservations;
        default:
          return a.username.localeCompare(b.username);
      }
    });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.active_reservations > 0).length,
    totalReservations: users.reduce((sum, user) => sum + user.total_reservations, 0),
    activeReservations: users.reduce((sum, user) => sum + user.active_reservations, 0)
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <User className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Σύνολο Χρηστών</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Ενεργοί Χρήστες</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="w-10 h-10 text-purple-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Συνολικές Κρατήσεις</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalReservations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Package className="w-10 h-10 text-orange-500 mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Ενεργές Κρατήσεις</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeReservations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Αναζήτηση</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Αναζήτηση χρηστών..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ρόλος</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="all">Όλοι οι Ρόλοι</option>
                <option value="admin">Διαχειριστής</option>
                <option value="user">Χρήστης</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ταξινόμηση κατά</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'username' | 'last_login' | 'reservations')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="username">Όνομα Χρήστη</option>
                <option value="last_login">Τελευταία Σύνδεση</option>
                <option value="reservations">Ενεργές Κρατήσεις</option>
              </select>
            </div>

            <div className="flex items-end">
              <Link
                href="/warehouse/users/new"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Προσθήκη Νέου Χρήστη
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Χρήστης
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ρόλος
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Τελευταία Σύνδεση
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Κρατήσεις
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
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Δεν βρέθηκαν χρήστες
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                          {user.name && (
                            <div className="text-sm text-gray-500">
                              {user.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Διαχειριστής' : 'Χρήστης'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleString()
                        : 'Ποτέ'
                      }
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">
                          {user.active_reservations} ενεργές
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.total_reservations} συνολικά
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <Link
                          href={`/warehouse/users/${user.id}/reservations`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Προβολή Κρατήσεων
                        </Link>
                        <Link
                          href={`/warehouse/users/${user.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Επεξεργασία
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Προηγούμενο
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Επόμενο
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Εμφάνιση <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> έως{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                  </span>{' '}
                  από <span className="font-medium">{filteredUsers.length}</span> χρήστες
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Προηγούμενο</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {[...Array(totalPages)].map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        currentPage === idx + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                      } text-sm font-medium`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                  >
                    <span className="sr-only">Επόμενο</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
    </div>
  );
};

export default UsersComponent;