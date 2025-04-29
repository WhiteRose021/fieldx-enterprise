"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SettingsHeader from "../../../components/SettingsHeader";
import { EntityService } from "@/services/entity-service";
import { EntityDefinition, FieldDefinition } from "@/types/entity-management";
import {
  Type, Edit, Eye, Trash2, AlertCircle,
  Search, Plus, Loader2, ArrowLeft, ArrowUp, ArrowDown,
  Check, X, ListFilter
} from "lucide-react";

export default function EntityFieldsPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityDefinition | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const entityId = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load entity and fields in parallel
        const [entityData, fieldsData] = await Promise.all([
          EntityService.getEntityById(entityId),
          EntityService.getEntityFields(entityId)
        ]);
        
        if (!entityData) {
          setError("Entity not found");
          return;
        }
        
        setEntity(entityData);
        setFields(fieldsData);
        setError(null);
      } catch (err) {
        setError("Failed to load entity fields");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      loadData();
    }
  }, [entityId]);

  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredFields = fields.filter(field => 
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFields = [...filteredFields].sort((a, b) => {
    const valA = a[sortColumn as keyof FieldDefinition] as string;
    const valB = b[sortColumn as keyof FieldDefinition] as string;
    
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <>
      <SettingsHeader
        title={`Fields: ${entity?.displayName || 'Loading...'}`}
        description="Manage fields, attributes, and data types for this entity"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/settings/entities/${entityId}`)}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Entity
            </button>
            <Link 
              href={`/settings/entities/${entityId}/fields/new`} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Field
            </Link>
          </div>
        }
      />
      <div className="p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-t border-b border-gray-200">
                  <th 
                    className="px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                    onClick={() => handleSort("label")}
                  >
                    <div className="flex items-center">
                      Display Name
                      {sortColumn === "label" && (
                        sortDirection === "asc" 
                          ? <ArrowUp className="h-4 w-4 ml-1" /> 
                          : <ArrowDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      API Name
                      {sortColumn === "name" && (
                        sortDirection === "asc" 
                          ? <ArrowUp className="h-4 w-4 ml-1" /> 
                          : <ArrowDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                    onClick={() => handleSort("type")}
                  >
                    <div className="flex items-center">
                      Type
                      {sortColumn === "type" && (
                        sortDirection === "asc" 
                          ? <ArrowUp className="h-4 w-4 ml-1" /> 
                          : <ArrowDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Required
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Searchable
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Filterable
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Sortable
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedFields.map((field) => (
                  <tr 
                    key={field.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                          <Type className="h-4 w-4" />
                        </div>
                        <div className="ml-3 text-sm font-medium text-gray-900">
                          {field.label}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {field.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.required ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.searchable ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.filterable ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {field.sortable ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400" />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/settings/entities/${entityId}/fields/${field.id}`}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Field Details"
                        >
                          <Eye className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/settings/entities/${entityId}/fields/${field.id}/edit`}
                          className="text-green-600 hover:text-green-800"
                          title="Edit Field"
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        {!field.readOnly && (
                          <button
                            onClick={() => {
                              // Would show a confirmation modal in a real implementation
                              alert(`Would delete field: ${field.label}`);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Field"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedFields.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <ListFilter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No fields found</h3>
                <p className="mt-2">
                  {searchTerm 
                    ? "Try adjusting your search terms" 
                    : "Create a new field to get started"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}