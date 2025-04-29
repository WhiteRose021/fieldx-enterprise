"use client";

import React, { useState } from 'react';
import { warehouseService } from "@/services/warehouseService";
import { Product } from "@/types/warehouse";
import { 
  FileDown, 
  Check, 
  X,
  AlertTriangle,
  Filter,
  ChevronDown,
  Loader2
} from "lucide-react";
import * as XLSX from 'xlsx';

interface ExportOptions {
  includeDetails: boolean;
  includeStock: boolean;
  includeDeleted: boolean;
  includeCategories: string[];
  includeLocations: string[];
}

const ProductExcelExport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    includeDetails: true,
    includeStock: true,
    includeDeleted: false,
    includeCategories: [],
    includeLocations: []
  });

  // Get unique categories and locations
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))).sort();
  const locations = Array.from(new Set(products.map(p => p.location).filter(Boolean))).sort();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await warehouseService.getProducts({
        showDeleted: options.includeDeleted ? "true" : "false"
      });
      
      setProducts(response.products || []);
    } catch (err) {
      setError("Αποτυχία λήψης προϊόντων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, [options.includeDeleted]);

  const handleExport = () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter products based on options
      let filteredProducts = [...products];
      
      if (options.includeCategories.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          options.includeCategories.includes(p.category || '')
        );
      }
      
      if (options.includeLocations.length > 0) {
        filteredProducts = filteredProducts.filter(p => 
          options.includeLocations.includes(p.location || '')
        );
      }
      
      if (filteredProducts.length === 0) {
        setError("Δεν υπάρχουν προϊόντα για εξαγωγή με τα επιλεγμένα φίλτρα.");
        setLoading(false);
        return;
      }

      // Define Excel worksheet columns based on options
      const columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Όνομα', key: 'name', width: 30 },
      ];
      
      if (options.includeDetails) {
        columns.push(
          { header: 'Κατηγορία', key: 'category', width: 20 },
          { header: 'Περιγραφή', key: 'description', width: 40 },
          { header: 'Τοποθεσία', key: 'location', width: 20 }
        );
      }
      
      if (options.includeStock) {
        columns.push(
          { header: 'Απόθεμα', key: 'stock', width: 10 },
          { header: 'Ελάχιστο Απόθεμα', key: 'min_stock', width: 15 }
        );
      }

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(
        filteredProducts.map(p => {
          const row: any = {
            sku: p.sku,
            name: p.name
          };
          
          if (options.includeDetails) {
            row.category = p.category || '';
            row.description = p.description || '';
            row.location = p.location || '';
          }
          
          if (options.includeStock) {
            row.stock = p.stock;
            row.min_stock = p.min_stock || 0;
          }
          
          return row;
        })
      );

      // Set column widths
      const defaultColWidth = 15;
      const columnWidths = columns.map(col => ({ wch: col.width || defaultColWidth }));
      worksheet['!cols'] = columnWidths;

      // Adjust row heights based on content
      const rowCount = filteredProducts.length + 1; // +1 for header
      const rowHeights = [];
      for (let i = 0; i < rowCount; i++) {
        // Adjust row height - header is taller, and rows with more text get more height
        const rowHeight = i === 0 ? 25 : 20;
        rowHeights.push({ hpt: rowHeight });
      }
      worksheet['!rows'] = rowHeights;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Προϊόντα');

      // Generate Excel file
      XLSX.writeFile(workbook, `Προϊόντα_${new Date().toISOString().slice(0, 10)}.xlsx`);

      setSuccess(`Επιτυχής εξαγωγή ${filteredProducts.length} προϊόντων σε αρχείο Excel.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Αποτυχία εξαγωγής προϊόντων. Παρακαλώ δοκιμάστε ξανά.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    setOptions(prev => ({
      ...prev,
      includeCategories: prev.includeCategories.includes(category)
        ? prev.includeCategories.filter(c => c !== category)
        : [...prev.includeCategories, category]
    }));
  };

  const toggleLocation = (location: string) => {
    setOptions(prev => ({
      ...prev,
      includeLocations: prev.includeLocations.includes(location)
        ? prev.includeLocations.filter(l => l !== location)
        : [...prev.includeLocations, location]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <FileDown className="mr-2 h-5 w-5 text-blue-600" />
          Εξαγωγή Προϊόντων σε Excel
        </h2>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="ml-3 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <div className="flex">
            <Check className="h-5 w-5 text-green-500" />
            <p className="ml-3 text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-medium text-gray-900">Επιλογές Εξαγωγής</h3>
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Filter className="h-4 w-4 mr-1" />
            Φίλτρα
            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={options.includeDetails}
                onChange={() => setOptions(prev => ({ ...prev, includeDetails: !prev.includeDetails }))}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-2">
                <span className="text-sm font-medium text-gray-900">Λεπτομέρειες Προϊόντος</span>
                <p className="text-xs text-gray-500">Συμπερίληψη κατηγορίας, περιγραφής και τοποθεσίας</p>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={options.includeStock}
                onChange={() => setOptions(prev => ({ ...prev, includeStock: !prev.includeStock }))}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-2">
                <span className="text-sm font-medium text-gray-900">Πληροφορίες Αποθέματος</span>
                <p className="text-xs text-gray-500">Συμπερίληψη τρέχοντος και ελάχιστου αποθέματος</p>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={options.includeDeleted}
                onChange={() => setOptions(prev => ({ ...prev, includeDeleted: !prev.includeDeleted }))}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-2">
                <span className="text-sm font-medium text-gray-900">Διαγραμμένα Προϊόντα</span>
                <p className="text-xs text-gray-500">Συμπερίληψη διαγραμμένων προϊόντων στην εξαγωγή</p>
              </div>
            </label>
          </div>

          {isFiltersOpen && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Κατηγορίες</h4>
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <label key={category} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={options.includeCategories.includes(category)}
                            onChange={() => toggleCategory(category)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{category}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Δεν βρέθηκαν κατηγορίες</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Τοποθεσίες</h4>
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
                    {locations.length > 0 ? (
                      locations.map((location) => (
                        <label key={location} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={options.includeLocations.includes(location)}
                            onChange={() => toggleLocation(location)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{location}</span>
                        </label>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Δεν βρέθηκαν τοποθεσίες</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setOptions(prev => ({
                    ...prev,
                    includeCategories: [],
                    includeLocations: []
                  }))}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Καθαρισμός Φίλτρων
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center">
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full max-w-md py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Επεξεργασία...
              </>
            ) : (
              <>
                <FileDown className="h-5 w-5 mr-2" />
                Εξαγωγή {products.length} προϊόντων σε Excel
              </>
            )}
          </button>
          
          <p className="mt-4 text-xs text-gray-500 text-center">
            Το αρχείο Excel θα περιέχει {options.includeCategories.length > 0 || options.includeLocations.length > 0 ? 'τα φιλτραρισμένα' : 'όλα τα'} προϊόντα {options.includeDeleted ? '(συμπεριλαμβανομένων των διαγραμμένων)' : ''}.
            <br />
            Θα δημιουργηθούν αυτόματα στήλες με βάση τις επιλεγμένες ρυθμίσεις.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductExcelExport;