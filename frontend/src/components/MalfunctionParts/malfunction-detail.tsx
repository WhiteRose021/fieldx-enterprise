"use client";

import React, { useState } from 'react';
import { 
  FileText, 
  Building2, 
  ClipboardList, 
  Shovel, 
  Layers, 
  CheckCircle, 
  Clock
} from 'lucide-react';
import { Malfunction } from '@/lib/api/malfunctions';
import { 
  FIELD_DEFINITIONS, 
  LAYOUT_SECTIONS, 
  JOB_DESCRIPTION_OPTIONS, 
  STATUS_OPTIONS, 
  YES_NO_OPTIONS, 
  getStatusStyle, 
  getBlowingDoneStyle
} from '@/lib/config/malfunctions';

interface MalfunctionDetailProps {
  malfunction: Malfunction;
  isEditMode: boolean;
  formData: Partial<Malfunction>;
  onInputChange: (fieldName: string, value: any) => void;
  formatDate: (dateString: string | null | undefined) => string;
}

const MalfunctionDetail: React.FC<MalfunctionDetailProps> = ({ 
  malfunction, 
  isEditMode, 
  formData, 
  onInputChange, 
  formatDate 
}) => {
  // Render field value based on field type
  const renderFieldValue = (field: string, value: any) => {
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      return <span className="text-gray-400">-</span>;
    }
    
    const fieldDef = FIELD_DEFINITIONS[field] || { type: "varchar", label: field };
    
    switch (fieldDef.type) {
      case "enum":
        if (field === "status") {
          return (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(value)}`}>
              {value}
            </span>
          );
        } else if (field === "blowingDone") {
          return <span className={getBlowingDoneStyle(value)}>{value}</span>;
        }
        return <span>{value}</span>;
        
      case "checklist":
        if (Array.isArray(value) && value.length > 0) {
          return (
            <div className="space-y-1">
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
        
      case "datetime":
        return <span>{formatDate(value)}</span>;
        
      case "text":
        return <span className="whitespace-pre-wrap">{value}</span>;
        
      case "bool":
        return <span>{value ? "Ναι" : "Όχι"}</span>;
        
      case "int":
        return <span>{value}</span>;
        
      default:
        return <span>{value}</span>;
    }
  };
  
  // Render edit field based on field type
  const renderEditField = (field: string, value: any) => {
    const fieldDef = FIELD_DEFINITIONS[field] || { type: "varchar", label: field };
    
    switch (fieldDef.type) {
      case "enum":
        if (field === "status") {
          return (
            <select
              value={value || ""}
              onChange={(e) => onInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Επιλέξτε...</option>
              {STATUS_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        } else if (field === "blowingDone") {
          return (
            <select
              value={value || ""}
              onChange={(e) => onInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Επιλέξτε...</option>
              {YES_NO_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        } else if (field === "jobdescription") {
          return (
            <select
              value={value || ""}
              onChange={(e) => onInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Επιλέξτε...</option>
              {JOB_DESCRIPTION_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        } else {
          return (
            <input
              type="text"
              value={value || ""}
              onChange={(e) => onInputChange(field, e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        }
        
      case "checklist":
        // For simplicity, we'll use a comma-separated input for now
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(", ") : value || ""}
            onChange={(e) => {
              const newValue = e.target.value.split(",").map(item => item.trim());
              onInputChange(field, newValue);
            }}
            placeholder="Comma-separated values"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      case "text":
        return (
          <textarea
            value={value || ""}
            onChange={(e) => onInputChange(field, e.target.value)}
            rows={4}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      case "bool":
        return (
          <select
            value={value ? "true" : "false"}
            onChange={(e) => onInputChange(field, e.target.value === "true")}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="true">Ναι</option>
            <option value="false">Όχι</option>
          </select>
        );
        
      case "int":
        return (
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onInputChange(field, e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      default:
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onInputChange(field, e.target.value)}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  // Helper function to check if a value should be displayed
  const hasDisplayableValue = (field: string, value: any): boolean => {
    // Special case for fields that we always want to show if they exist in the API response
    if (field === "type" || field === "jobdescription" || 
        field === "metravlavhcab" || field === "metravlavhbcpbep" || 
        field === "metravlavhbepfb" || field === "splittertype" || 
        field === "splitterbcp" || field === "moufarisma") {
      // If we're in edit mode, always show these fields
      if (isEditMode) return true;
      
      // Otherwise, only show them if they have a value
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }
    
    // In edit mode, show all fields
    if (isEditMode) return true;
    
    // Null or undefined values should not be displayed
    if (value === null || value === undefined) return false;
    
    // Empty strings should not be displayed
    if (typeof value === 'string' && value.trim() === '') return false;
    
    // Empty arrays should not be displayed
    if (Array.isArray(value) && value.length === 0) return false;
    
    // Zero number values should still be displayed
    if (typeof value === 'number') return true;
    
    // Boolean values should be displayed
    if (typeof value === 'boolean') return true;
    
    // All other values should be displayed
    return true;
  };

  // Function to get the icon component by name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText size={20} className="text-gray-500" />;
      case 'Building2':
        return <Building2 size={20} className="text-gray-500" />;
      case 'ClipboardList':
        return <ClipboardList size={20} className="text-gray-500" />;
      case 'Shovel':
        return <Shovel size={20} className="text-gray-500" />;
      case 'Layers':
        return <Layers size={20} className="text-gray-500" />;
      case 'Clock':
        return <Clock size={20} className="text-gray-500" />;
      default:
        return <FileText size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Render each section based on the layout definition */}
      {LAYOUT_SECTIONS.map((section) => {
        // Check if section should be shown based on condition
        if (section.condition && !section.condition(malfunction)) {
          return null;
        }
        
        // Filter out fields that have no value
        const fieldsWithValues = section.fields.filter(field => {
          // Skip attachment fields in the details tab
          if (field === "photos" || field === "soilphotos" || field === "pdfattachment") {
            return false;
          }
          
          // Always include specific sections even if empty when in edit mode
          if ((section.id === "section4" || section.id === "section5") && isEditMode) {
            return true;
          }
          
          // Check if field exists in malfunction and has a displayable value
          const value = isEditMode ? 
            formData[field as keyof Malfunction] : 
            malfunction[field as keyof Malfunction];
          
          return hasDisplayableValue(field, value);
        });
        
        // If no fields have values and we're not in sections that should always show in edit mode, hide the section
        if (fieldsWithValues.length === 0 && 
            !(isEditMode && (section.id === "section4" || section.id === "section5"))) {
          return null;
        }
        
        return (
          <div key={section.id} className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              {section.icon && getIconComponent(section.icon)}
              {section.label}
            </h2>
            
            <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 text-sm">
              {fieldsWithValues.map((field) => {
                const value = isEditMode ? 
                  formData[field as keyof Malfunction] : 
                  malfunction[field as keyof Malfunction];
                
                const label = FIELD_DEFINITIONS[field]?.label || field;
                
                // Skip rendering if the field shouldn't be displayed
                if (!hasDisplayableValue(field, value) && !isEditMode) {
                  return null;
                }
                
                return (
                  <React.Fragment key={field}>
                    <span className="text-gray-600">{label}:</span>
                    <div>
                      {isEditMode ? (
                        renderEditField(field, value)
                      ) : (
                        renderFieldValue(field, value)
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Creation/Modification Information - always show this section */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-gray-500" />
          Πληροφορίες Συστήματος
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Δημιουργήθηκε από:</p>
            <p>{malfunction.createdByName || "N/A"} | {formatDate(malfunction.createdAt)}</p>
          </div>
          <div>
            <p className="text-gray-600">Τελευταία τροποποίηση:</p>
            <p>{malfunction.modifiedByName || "N/A"} | {formatDate(malfunction.modifiedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MalfunctionDetail;