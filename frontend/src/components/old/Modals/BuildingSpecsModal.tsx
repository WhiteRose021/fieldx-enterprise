"use client";

import React, { useState, useRef, useCallback } from "react";
import { X, Upload, FileText, AlertCircle, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface BuildingSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: BuildingSpecsData) => void;
  sr: string;
}

export interface BuildingSpecsData {
  floorsTable: string | null;
  opticalPathsTable: string | null;
  buildingData: Record<string, any> | null;
}

const BuildingSpecsModal: React.FC<BuildingSpecsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  sr 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setError(null);
    
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        setError('Παρακαλώ επιλέξτε αρχείο Excel (.xlsx)');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const classifyOpticalPath = (opticalPath: string): string => {
    opticalPath = opticalPath.trim();

    // Remove "IN " or "OUT " prefix if present
    if (opticalPath.startsWith("IN ") || opticalPath.startsWith("OUT ")) {
      opticalPath = opticalPath.substring(3);
    }

    if (opticalPath.startsWith("G") && opticalPath.includes("BEP")) {
      return "CAB-BEP";
    } else if (opticalPath.startsWith("G") && opticalPath.includes("BCP")) {
      return "CAB-BCP";
    } else if (opticalPath.includes("BMO") && opticalPath.includes("FB")) {
      return "BMO-FB";
    } else if (opticalPath.includes("BEP") && opticalPath.includes("BMO")) {
      return "BEP-BMO";
    } else if (opticalPath.includes("BCP") && opticalPath.includes("BEP")) {
      return "BCP-BEP";
    }

    return "Unknown";
  };

  const processSheetData = (sheet: XLSX.WorkSheet, sheetName: string, htmlFormat = true): string => {
    // Get headers (first row)
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const headers: string[] = [];
    
    // Extract headers from the first row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = sheet[cellAddress];
      headers.push(cell?.v ? String(cell.v).trim() : '');
    }
    
    // Filter out empty headers
    const filteredHeaders = headers.filter(h => h);
    
    const isOpticalPathsSheet = sheetName === 'OPTICAL PATHS';
    
    if (htmlFormat) {
      let htmlTable = "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>";
      htmlTable += "<thead><tr>";
      
      filteredHeaders.forEach(header => {
        htmlTable += `<th>${htmlTable.includes(header) ? header : header}</th>`;
      });
      
      htmlTable += "</tr></thead><tbody>";
      
      // Process data rows (starting from row 2)
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const rowData: string[] = [];
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = sheet[cellAddress];
          rowData[C] = cell ? String(cell.v).trim() : '';
        }
        
        if (rowData.some(cell => cell)) {
          // Special processing for OPTICAL PATHS sheet
          if (isOpticalPathsSheet) {
            const opticalPath = rowData[1] || ''; // Assuming OPTICAL PATH is the second column
            
            if (opticalPath) {
              // Clean the optical path
              let cleanPath = opticalPath;
              if (cleanPath.startsWith("IN ") || cleanPath.startsWith("OUT ")) {
                cleanPath = cleanPath.substring(3).trim();
                rowData[1] = cleanPath;
              }
              
              // Classify the optical path
              const pathType = classifyOpticalPath(cleanPath);
              if (pathType !== "Unknown") {
                rowData[0] = pathType; // Set the OPTICAL PATH TYPE
                
                htmlTable += "<tr>";
                rowData.forEach(cell => {
                  htmlTable += `<td>${cell}</td>`;
                });
                htmlTable += "</tr>";
              }
            }
          } else {
            // Normal processing for other sheets
            htmlTable += "<tr>";
            rowData.forEach(cell => {
              htmlTable += `<td>${cell}</td>`;
            });
            htmlTable += "</tr>";
          }
        }
      }
      
      htmlTable += "</tbody></table>";
      return htmlTable;
    } else {
      // Plain text format (similar to the PHP hook)
      let formattedData = filteredHeaders.join(" | ") + "\n";
      formattedData += "-".repeat(formattedData.length) + "\n";
      
      // Process data rows
      for (let R = range.s.r + 1; R <= range.e.r; ++R) {
        const rowData: string[] = [];
        
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = sheet[cellAddress];
          rowData[C] = cell ? String(cell.v).trim() : '';
        }
        
        if (rowData.some(cell => cell)) {
          // Special processing for OPTICAL PATHS sheet
          if (isOpticalPathsSheet) {
            const opticalPath = rowData[1] || '';
            
            if (opticalPath) {
              let cleanPath = opticalPath;
              if (cleanPath.startsWith("IN ") || cleanPath.startsWith("OUT ")) {
                cleanPath = cleanPath.substring(3).trim();
                rowData[1] = cleanPath;
              }
              
              const pathType = classifyOpticalPath(cleanPath);
              if (pathType !== "Unknown") {
                rowData[0] = pathType;
                
                const formattedRow: string[] = [];
                filteredHeaders.forEach((header, index) => {
                  const value = rowData[index] || '';
                  formattedRow.push(`${header}: ${value}`);
                });
                formattedData += formattedRow.join(" | ") + "\n";
              }
            }
          } else {
            // Normal processing for other sheets
            const formattedRow: string[] = [];
            filteredHeaders.forEach((header, index) => {
              const value = rowData[index] || '';
              formattedRow.push(`${header}: ${value}`);
            });
            formattedData += formattedRow.join(" | ") + "\n";
          }
        }
      }
      
      return formattedData.trim();
    }
  };

  const processExcelFile = useCallback(async () => {
    if (!file) {
      setError('Παρακαλώ επιλέξτε ένα αρχείο Excel');
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress('Επεξεργασία αρχείου...');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellStyles: true,
        cellFormulas: true,
        cellDates: true,
        cellNF: true,
        sheetStubs: true
      });

      setProgress('Αναζήτηση φύλλων εργασίας...');
      
      // Process ΚΤΗΡΙΟ sheet for building data
      const buildingSheet = workbook.Sheets['ΚΤΗΡΙΟ'];
      let buildingData: Record<string, any> = {};
      
      if (buildingSheet) {
        // Cell mapping similar to the PHP hook
        const cellData: Record<string, string> = {
          'areatype': 'C2',
          'apostasticab': 'R2',
          'beponly': 'H2',
          'beptemplate': 'I2',
          'beptype': 'J2',
          'bid': 'B2',
          'bmotype': 'K2',
          'conduit': 'Q2',
          'existingbcp': 'N2',
          'failure': 'W2',
          'ipografi': 'G2',
          'lat': 'S2',
          'long': 'T2',
          'nanotronix': 'L22',
          'nearbcp': 'O2',
          'neobcp': 'P2',
          'notes': 'U2',
          'orofoi': 'D2',
          'orofosbep': 'F2',
          'orofospel': 'E2',
          'smart': 'M2',
          'name': 'A2',
          'warning': 'V2'
        };
        
        // Extract data from cells
        Object.entries(cellData).forEach(([field, cell]) => {
          const cellRef = buildingSheet[cell];
          if (cellRef) {
            let value = cellRef.v;
            
            // Format boolean-like values
            if (typeof value === 'string' && ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'].includes(value.toLowerCase())) {
              value = ['true', '1', 'yes', 'on'].includes(value.toLowerCase()) ? 'TRUE' : 'FALSE';
            }
            
            // Format coordinates
            if ((field === 'lat' || field === 'long') && typeof value === 'number' && value.toString().length > 2) {
              value = value.toString().substring(0, 2) + '.' + value.toString().substring(2);
            }
            
            buildingData[field] = value;
          }
        });
      }

      setProgress('Επεξεργασία δεδομένων ορόφων...');
      
      // Process ΟΡΟΦΟΙ sheet
      const floorsSheet = workbook.Sheets['ΟΡΟΦΟΙ'];
      let floorsTable = null;
      
      if (floorsSheet) {
        floorsTable = processSheetData(floorsSheet, 'ΟΡΟΦΟΙ', true);
      }

      setProgress('Επεξεργασία οπτικών διαδρομών...');
      
      // Process OPTICAL PATHS sheet
      const opticalPathsSheet = workbook.Sheets['OPTICAL PATHS'];
      let opticalPathsTable = null;
      
      if (opticalPathsSheet) {
        opticalPathsTable = processSheetData(opticalPathsSheet, 'OPTICAL PATHS', true);
      }

      // All processing complete, call onSuccess with the data
      onSuccess({
        floorsTable,
        opticalPathsTable,
        buildingData
      });

      setProgress('Η επεξεργασία ολοκληρώθηκε επιτυχώς');
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError('Σφάλμα κατά την επεξεργασία του αρχείου Excel');
    } finally {
      setIsLoading(false);
    }
  }, [file, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-aspro rounded-lg shadow-lg w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Προδεσμευη και Προδιαγραφές Κτηρίου</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Κλείσιμο"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="excelFile"
                accept=".xlsx"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText size={48} className="text-blue-500 mb-2" />
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  <button
                    className="mt-3 px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 transition-colors"
                    onClick={() => setFile(null)}
                  >
                    Αφαίρεση
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload size={48} className="text-gray-400 mb-2" />
                  <p className="text-gray-600 mb-2">
                    Ανεβάστε το αρχείο Excel (.xlsx) με τις προδιαγραφές του κτηρίου
                  </p>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Επιλογή Αρχείου
                  </button>
                </div>
              )}
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-start">
                <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            {progress && !error && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-md flex items-center">
                {isLoading ? (
                  <Loader2 size={18} className="mr-2 animate-spin flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 mr-2 rounded-full bg-green-500 text-white flex items-center justify-center">✓</div>
                )}
                <span>{progress}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Ακύρωση
          </button>
          <button
            onClick={processExcelFile}
            disabled={!file || isLoading}
            className={`px-4 py-2 rounded-md ${
              !file || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 size={16} className="animate-spin mr-2" />
                Επεξεργασία...
              </span>
            ) : (
              'Επεξεργασία'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingSpecsModal;