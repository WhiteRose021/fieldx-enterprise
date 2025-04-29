import React, { useState } from 'react';
import { Upload, Download, BarChart2, Clipboard, FileText } from 'lucide-react';
import ImportModal from './ImportModal';
import ExportModal from './ExportModal';
import Papa from 'papaparse';
import { Product } from '@/types/warehouse';

interface WarehouseActionsProps {
  onImport: (file: File) => Promise<void>;
  products?: Product[];
}

const WarehouseActions: React.FC<WarehouseActionsProps> = ({
  onImport,
  products = [] // Default empty array
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleImportFile = async (file: File) => {
    try {
      await onImport(file);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    try {
      const exportData = products.map(product => ({
        SKU: product.sku || '',
        Name: product.name || '',
        Category: product.category || '',
        Description: product.description || '',
        Location: product.location || '',
        Stock: product.stock || 0,
        Status: product.isDeleted ? 'Deleted' : 'Active'
      }));

      const csv = Papa.unparse(exportData, {
        delimiter: ';',
        header: true
      });

      // Create and download the file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `warehouse_products_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  };

  // Calculate quick stats for the warehouse
  const calculateStats = () => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
    const categoryCounts = products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([category]) => category)[0] || 'None';
    
    return {
      totalProducts,
      totalStock,
      lowStockItems: products.filter(p => p.stock > 0 && p.stock <= 5).length,
      outOfStockItems: products.filter(p => p.stock === 0).length,
      topCategory
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 shadow-sm"
        >
          <div className="p-2 rounded-md bg-blue-100">
            <Upload className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Import</div>
            <div className="text-xs text-gray-500">CSV/Excel</div>
          </div>
        </button>

        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 shadow-sm"
        >
          <div className="p-2 rounded-md bg-green-100">
            <Download className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Export</div>
            <div className="text-xs text-gray-500">{products.length} Products</div>
          </div>
        </button>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 shadow-sm"
        >
          <div className="p-2 rounded-md bg-purple-100">
            <BarChart2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Reports</div>
            <div className="text-xs text-gray-500">Stock Analytics</div>
          </div>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors duration-200 border border-gray-300 shadow-sm"
        >
          <div className="p-2 rounded-md bg-gray-100">
            <FileText className="w-4 h-4 text-gray-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Print</div>
            <div className="text-xs text-gray-500">Inventory List</div>
          </div>
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 flex flex-wrap justify-between">
        <div className="px-3 py-1 text-center">
          <div className="text-xs text-gray-500">Total Products</div>
          <div className="text-sm font-medium">{stats.totalProducts}</div>
        </div>
        <div className="px-3 py-1 text-center">
          <div className="text-xs text-gray-500">Total Stock</div>
          <div className="text-sm font-medium">{stats.totalStock} units</div>
        </div>
        <div className="px-3 py-1 text-center">
          <div className="text-xs text-gray-500">Low Stock</div>
          <div className="text-sm font-medium">{stats.lowStockItems} products</div>
        </div>
        <div className="px-3 py-1 text-center">
          <div className="text-xs text-gray-500">Out of Stock</div>
          <div className="text-sm font-medium">{stats.outOfStockItems} products</div>
        </div>
        <div className="px-3 py-1 text-center">
          <div className="text-xs text-gray-500">Top Category</div>
          <div className="text-sm font-medium">{stats.topCategory}</div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportFile}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        productCount={products.length}
      />
    </div>
  );
};

export default WarehouseActions;