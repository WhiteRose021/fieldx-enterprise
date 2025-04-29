import React, { useState } from 'react';
import { Product } from '@/types/warehouse';
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  PackageOpen, 
  Plus, 
  Minus, 
  Eye,
  AlertTriangle,
  CheckCircle,
  MoreHorizontal,
  Package,
  ArrowUpDown
} from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: number) => void;
  onStockUpdate: (productId: number, quantity: number) => void;
  onQuantityChange: (productId: number, quantity: number) => void;
  quantities: { [key: number]: number };
}

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onEdit,
  onDelete,
  onStockUpdate,
  onQuantityChange,
  quantities
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);
  const itemsPerPage = 10;
  
  // Sort and paginate products
  const sortedProducts = [...products].sort((a, b) => {
    const fieldA = a[sortField as keyof Product];
    const fieldB = b[sortField as keyof Product];
    
    if (fieldA === undefined || fieldB === undefined) return 0;
    
    // Compare based on type
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    } else {
      // For numbers and other types
      return sortDirection === 'asc'
        ? (fieldA > fieldB ? 1 : -1)
        : (fieldA < fieldB ? 1 : -1);
    }
  });
  
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field clicked
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to asc
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const toggleProductDetails = (productId: number) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  const renderStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle size={12} />
          Εκτός αποθέματος
        </span>
      );
    } else if (stock <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <AlertTriangle size={12} />
          Χαμηλό απόθεμα ({stock})
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle size={12} />
          {stock} σε απόθεμα
        </span>
      );
    }
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded text-sm ${
            currentPage === i
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center mt-4 space-x-2">
        <button
          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 mx-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              1
            </button>
            {startPage > 2 && <span className="mx-1">...</span>}
          </>
        )}
        {pages}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="mx-1">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1 mx-1 rounded text-sm bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              {totalPages}
            </button>
          </>
        )}
        <button
          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  return (
    <div className="bg-aspro rounded-lg shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('name')}
                >
                  Πληροφορίες Προϊόντος
                  {sortField === 'name' && (
                    <ArrowUpDown size={14} className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('category')}
                >
                  Κατηγορία
                  {sortField === 'category' && (
                    <ArrowUpDown size={14} className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('location')}
                >
                  Τοποθεσία
                  {sortField === 'location' && (
                    <ArrowUpDown size={14} className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  className="flex items-center gap-1 hover:text-gray-700"
                  onClick={() => handleSort('stock')}
                >
                  Απόθεμα
                  {sortField === 'stock' && (
                    <ArrowUpDown size={14} className={`transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Κράτηση
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ενέργειες
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedProducts.map((product) => (
              <React.Fragment key={product.id}>
                <tr
                  className={`hover:bg-gray-50 transition-colors ${product.isDeleted ? 'bg-red-50 opacity-60' : ''}`}
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-md ${product.isDeleted ? 'bg-red-100' : 'bg-blue-100'} mr-3`}>
                        <Package className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-1">
                          {product.name}
                          {product.isDeleted && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Διαγραμμένο</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">
                      {product.location || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    {renderStockBadge(product.stock)}
                  </td>
                  <td className="p-4">
                    {product.stock > 0 && !product.isDeleted ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const currentQty = quantities[product.id] || 0;
                            if (currentQty > 0) {
                              onQuantityChange(product.id, currentQty - 1);
                            }
                          }}
                          disabled={(quantities[product.id] || 0) === 0}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={quantities[product.id] || ''}
                          placeholder="0"
                          onChange={(e) => {
                            // Remove leading zeros and parse the value
                            const rawValue = e.target.value.replace(/^0+/, '');
                            const value = Math.min(
                              Math.max(0, parseInt(rawValue || '0')),
                              product.stock
                            );
                            onQuantityChange(product.id, value);
                          }}
                          className="w-16 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max={product.stock}
                        />
                        <button
                          onClick={() => {
                            const currentQty = quantities[product.id] || 0;
                            if (currentQty < product.stock) {
                              onQuantityChange(product.id, currentQty + 1);
                            }
                          }}
                          disabled={(quantities[product.id] || 0) >= product.stock}
                          className="p-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">
                        {product.isDeleted ? "Μη διαθέσιμο" : "Εκτός αποθέματος"}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleProductDetails(product.id)}
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                        title="Προβολή Λεπτομερειών"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      {!product.isDeleted && (
                        <button
                          onClick={() => onEdit(product)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="Επεξεργασία"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-gray-500 hover:text-red-600 transition-colors"
                        title={product.isDeleted ? "Επαναφορά" : "Διαγραφή"}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                
                {/* Expandable Row for Details */}
                {expandedProductId === product.id && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">Λεπτομέρειες Προϊόντος</h4>
                          <p className="text-sm text-gray-600">
                            {product.description || 'Δεν υπάρχει διαθέσιμη περιγραφή.'}
                          </p>
                          <div className="text-xs text-gray-500">
                            Τελευταία ενημέρωση: {new Date(product.updatedAt || Date.now()).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">Διαχείριση Αποθέματος</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-xs text-gray-500 mb-1">Ενημέρωση Αποθέματος</label>
                              <input
                                type="number"
                                min="0"
                                defaultValue={product.stock}
                                className="w-20 px-2 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                id={`stock-${product.id}`}
                              />
                            </div>
                            <button
                              onClick={() => {
                                const input = document.getElementById(`stock-${product.id}`) as HTMLInputElement;
                                const newStock = parseInt(input.value);
                                if (!isNaN(newStock) && newStock >= 0) {
                                  onStockUpdate(product.id, newStock);
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 mt-5"
                            >
                              Ενημέρωση
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-700">Γρήγορες Ενέργειες</h4>
                          <div className="flex flex-wrap gap-2">
                            <button 
                              onClick={() => onEdit(product)}
                              className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                              disabled={product.isDeleted}
                            >
                              <Edit2 size={12} />
                              Επεξεργασία Λεπτομερειών
                            </button>
                            
                            <button
                              onClick={() => {
                                if (product.stock > 0 && !quantities[product.id]) {
                                  onQuantityChange(product.id, 1);
                                }
                              }}
                              className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                              disabled={product.stock === 0 || product.isDeleted}
                            >
                              <PackageOpen size={12} />
                              Γρήγορη Κράτηση
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Δεν βρέθηκαν προϊόντα
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {/*Adjust this message based on filters applied*/}
              Προσθέστε νέα προϊόντα ή προσαρμόστε τα φίλτρα σας για να τα δείτε εδώ.
            </p>
          </div>
        )}
      </div>
      {products.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Εμφάνιση <span className="font-medium">{Math.min(products.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(products.length, currentPage * itemsPerPage)}</span> από <span className="font-medium">{products.length}</span> προϊόντα
            </div>
            {renderPagination()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductTable;