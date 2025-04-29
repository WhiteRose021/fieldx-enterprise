"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Database, Eye, Trash2, AlertCircle,
  Search, Plus, Loader2, ArrowUp, ArrowDown, RefreshCw
} from "lucide-react";
import SettingsHeader from "../components/SettingsHeader";

// Simple entity definition with no field type references
interface EntityDefinition {
  id: string;
  name: string;
  pluralName?: string;
  apiEndpoint: string;
  displayName: string;
  description?: string;
  isSystem?: boolean;
  isVisible?: boolean;
}

// Mock data as fallback
const MOCK_ENTITIES: EntityDefinition[] = [
  {
    id: "User",
    name: "User",
    pluralName: "Users",
    apiEndpoint: "/api/v1/User",
    displayName: "User",
    description: "User accounts and profiles",
    isSystem: true,
    isVisible: true
  },
  {
    id: "Autopsies",
    name: "Autopsies",
    pluralName: "Autopsies",
    apiEndpoint: "/api/v1/Autopsies",
    displayName: "Autopsies",
    description: "Building autopsies and inspections",
    isSystem: false,
    isVisible: true
  },
  {
    id: "Constructions",
    name: "Constructions",
    pluralName: "Constructions",
    apiEndpoint: "/api/v1/Constructions",
    displayName: "Constructions",
    description: "Building construction records",
    isSystem: false,
    isVisible: true
  }
];

export default function EntitiesPage() {
  const [entities, setEntities] = useState<EntityDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("displayName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [useMockData, setUseMockData] = useState(false);

  // Function to load entities from the API
  const loadEntities = async () => {
    try {
      setLoading(true);
      setUseMockData(false);
  
      const response = await fetch('/api/metadata/entities');
  
      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }
  
      const entityNames: string[] = await response.json();
  
      const formattedEntities = await Promise.all(
        entityNames.map(async (entityName: string) => {
          try {
            const metadataRes = await fetch(`/api/metadata/${entityName}`);
            if (!metadataRes.ok) throw new Error("Metadata fetch failed");
  
            const metadata = await metadataRes.json();
            const clientDef = metadata.clientDef || {};
  
            return {
              id: entityName,
              name: entityName,
              pluralName: clientDef.pluralLabel || `${entityName}s`,
              apiEndpoint: `/api/v1/${entityName}`,
              displayName: clientDef.label || entityName,
              description: clientDef.description || "",
              isSystem: ['User', 'Team', 'Role', 'Portal', 'Group', 'EmailAccount'].includes(entityName),
              isVisible: clientDef.isVisible !== false,
            };
          } catch (e) {
            console.warn(`Failed to fetch metadata for ${entityName}`, e);
            return {
              id: entityName,
              name: entityName,
              pluralName: `${entityName}s`,
              apiEndpoint: `/api/v1/${entityName}`,
              displayName: entityName,
              description: "",
              isSystem: ['User', 'Team', 'Role', 'Portal', 'Group', 'EmailAccount'].includes(entityName),
              isVisible: true
            };
          }
        })
      );
  
      // Filter out entities with isVisible === false
      const visibleEntities = formattedEntities.filter(e => e.isVisible);
  
      setEntities(visibleEntities);
      setError(null);
    } catch (err) {
      console.error("Error loading entities:", err);
      setError(err instanceof Error ? err.message : "Failed to load entities");
      setUseMockData(true);
      setEntities(MOCK_ENTITIES);
    } finally {
      setLoading(false);
    }
  };
  

  // Load entities on initial mount
  useEffect(() => {
    loadEntities();
  }, []);

  // Handle column sorting
  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filter entities based on search term
  const filteredEntities = entities.filter(entity => 
    entity.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entity.description && entity.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort filtered entities
  const sortedEntities = [...filteredEntities].sort((a, b) => {
    const valA = a[sortColumn as keyof EntityDefinition] as string || "";
    const valB = b[sortColumn as keyof EntityDefinition] as string || "";
    
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <>
      <SettingsHeader
        title="Entities"
        description="Manage application data entities"
        actions={
          <div className="flex items-center gap-2">
            <button 
              onClick={loadEntities}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 inline-flex items-center disabled:opacity-50"
              title="Refresh entities"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <Link 
              href="/settings/entities/new" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Entity
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
              placeholder="Search entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading entities...</span>
          </div>
        ) : error && !useMockData ? (
          <div className="flex flex-col justify-center items-center py-12 text-red-500">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span className="text-lg font-medium">Error loading entities</span>
            </div>
            <p className="text-sm text-gray-600">{error}</p>
            <button 
              onClick={loadEntities}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 inline-flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : useMockData ? (
          <div className="px-4 py-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Using demo data</span>
            </div>
            <p className="text-sm">
              Could not connect to entity API. Showing mock data for development purposes.
            </p>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th 
                  className="px-6 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort("displayName")}
                >
                  <div className="flex items-center">
                    Name
                    {sortColumn === "displayName" && (
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  <div className="flex items-center">
                    Description
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  API Endpoint
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sortedEntities.map((entity) => (
                <tr 
                  key={entity.id} 
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 flex-shrink-0 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                        <Database className="h-4 w-4" />
                      </div>
                      <div className="ml-3 text-sm font-medium text-gray-900">
                        {entity.displayName}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entity.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {entity.description || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entity.apiEndpoint}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${entity.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {entity.isSystem ? "System" : "Custom"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                      <Link
                        href={`/settings/entities/${entity.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Entity Details"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      {/* Delete button - disabled for now but still visible */}
                      <button
                        className="text-gray-400 cursor-not-allowed"
                        title="Delete Entity (Disabled)"
                        disabled
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedEntities.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white">
              <Database className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No entities found</h3>
              <p className="mt-2">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Create a new entity to get started"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}