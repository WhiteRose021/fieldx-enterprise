"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // You might need to implement these UI components
import SettingsHeader from "../../components/SettingsHeader";
import {
  Database, Loader2, AlertCircle, ArrowLeft, RefreshCw,
  ListFilter, Layout, Link2, Shield, Check, X, Edit, Trash2,
  Plus, ArrowUp, ArrowDown, Search, Eye
} from "lucide-react";

// Define interfaces for our data types
interface EntityDefinition {
  id: string;
  name: string;
  pluralName?: string;
  apiEndpoint: string;
  displayName: string;
  description?: string;
  icon?: string;
  isSystem?: boolean;
  isVisible?: boolean;
}

interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  label: string;
  required?: boolean;
  readOnly?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  options?: string[] | { id: string; label: string; value: string; color?: string }[];
  default?: any;
  // Add other field properties as needed
}

interface LayoutDefinition {
  id: string;
  name: string;
  type: string;
  isDefault?: boolean;
  data: any;
}

interface RelationshipDefinition {
  id: string;
  name: string;
  type: string;
  entity: string;
  foreignKey?: string;
  label?: string;
}

interface Permission {
  roleId: string;
  roleName: string;
  access: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    export: boolean;
    import: boolean;
  };
}

// Main component
export default function EntityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.id as string;
  
  // State for entity data
  const [entity, setEntity] = useState<EntityDefinition | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [layouts, setLayouts] = useState<LayoutDefinition[]>([]);
  const [relationships, setRelationships] = useState<RelationshipDefinition[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  // UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  // Load all entity data
  const loadEntityData = async () => {
    try {
      setLoading(true);
      
      // Fetch entity metadata
      const entityResponse = await fetch(`/api/metadata/${entityId}`);
      if (!entityResponse.ok) {
        throw new Error(`Failed to fetch entity: ${entityResponse.status}`);
      }
      
      const entityData = await entityResponse.json();
      const clientDef = entityData.clientDef || {};
      const entityDef = entityData.entityDef || {};
      
      // Construct entity object
      const entityObj: EntityDefinition = {
        id: entityId,
        name: entityId,
        pluralName: clientDef.pluralLabel || `${entityId}s`,
        apiEndpoint: `/api/v1/${entityId}`,
        displayName: clientDef.label || entityId,
        description: clientDef.description || "",
        icon: clientDef.iconClass || "database",
        isSystem: ['User', 'Team', 'Role', 'Portal', 'Group', 'EmailAccount'].includes(entityId),
        isVisible: true
      };
      
      setEntity(entityObj);
      
      // Fetch fields
      const fieldsResponse = await fetch(`/api/metadata/${entityId}/fields`);
      if (fieldsResponse.ok) {
        const fieldsData = await fieldsResponse.json();
        
        // Transform fields data
        const fieldsList = Object.entries(fieldsData.fields || {}).map(([name, fieldData]: [string, any]) => {
          return {
            id: name,
            name: name,
            type: fieldData.type || "varchar",
            label: fieldData.label || name,
            required: !!fieldData.required,
            readOnly: !!fieldData.readOnly,
            searchable: true, // Assuming all fields are searchable
            filterable: true, // Assuming all fields are filterable
            sortable: true,   // Assuming all fields are sortable
            options: fieldData.options || [],
            default: fieldData.default
          };
        });
        
        setFields(fieldsList);
      }
      
      // Fetch layouts
      const layoutsResponse = await fetch(`/api/metadata/${entityId}/layouts`);
      if (layoutsResponse.ok) {
        const layoutsData = await layoutsResponse.json();
        
        // Transform layouts data
        const layoutsList = Object.entries(layoutsData.layouts || {}).map(([name, layoutData]: [string, any]) => {
          return {
            id: `${entityId}-${name}`,
            name: name,
            type: name.includes('list') ? 'list' : name.includes('detail') ? 'detail' : 'edit',
            isDefault: true, // We don't have this info, so assume true
            data: layoutData
          };
        });
        
        setLayouts(layoutsList);
      }
      
      // Fetch relationships from links
      const relationships: RelationshipDefinition[] = [];
      
      if (entityDef.links) {
        Object.entries(entityDef.links || {}).forEach(([name, linkData]: [string, any]) => {
          relationships.push({
            id: name,
            name: name,
            type: linkData.type || "belongsTo",
            entity: linkData.entity || "",
            foreignKey: linkData.foreignKey,
            label: linkData.label || name
          });
        });
      }
      
      setRelationships(relationships);
      
      // Create dummy permissions data (in a real app, you'd fetch this from your API)
      const dummyPermissions: Permission[] = [
        {
          roleId: "admin",
          roleName: "Administrator",
          access: { view: true, create: true, edit: true, delete: true, export: true, import: true }
        },
        {
          roleId: "manager",
          roleName: "Manager",
          access: { view: true, create: true, edit: true, delete: false, export: true, import: false }
        },
        {
          roleId: "user",
          roleName: "Regular User",
          access: { view: true, create: false, edit: false, delete: false, export: false, import: false }
        }
      ];
      
      setPermissions(dummyPermissions);
      setError(null);
    } catch (err) {
      console.error("Error loading entity data:", err);
      setError(err instanceof Error ? err.message : "Failed to load entity data");
    } finally {
      setLoading(false);
    }
  };

  // Load entity data on initial mount
  useEffect(() => {
    if (entityId) {
      loadEntityData();
    }
  }, [entityId]);

  // Handle refresh
  const handleRefresh = () => {
    loadEntityData();
  };

  // Sorting handlers
  const handleSort = (column: string) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Get sorted fields
  const getSortedFields = () => {
    return [...fields]
      .filter(field => 
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const valA = a[sortColumn as keyof FieldDefinition] as string || "";
        const valB = b[sortColumn as keyof FieldDefinition] as string || "";
        
        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  };

  // Render functions for different tabs
  const renderOverview = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {entity && (
        <div className="space-y-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <Database className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">{entity.displayName}</h2>
              <div className="mt-1">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${entity.isSystem ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {entity.isSystem ? "System Entity" : "Custom Entity"}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{entity.description || "No description available"}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-base font-medium text-gray-900">Entity Details</h3>
              <dl className="mt-2 text-sm">
                <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100">
                  <dt className="font-medium text-gray-500">API Name</dt>
                  <dd className="text-gray-900">{entity.name}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100">
                  <dt className="font-medium text-gray-500">Plural Name</dt>
                  <dd className="text-gray-900">{entity.pluralName || `${entity.name}s`}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 py-3 border-b border-gray-100">
                  <dt className="font-medium text-gray-500">API Endpoint</dt>
                  <dd className="text-gray-900">{entity.apiEndpoint}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 py-3">
                  <dt className="font-medium text-gray-500">Visible in UI</dt>
                  <dd className="text-gray-900">{entity.isVisible ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>
            
            <div>
              <h3 className="text-base font-medium text-gray-900">Statistics</h3>
              <dl className="mt-2 text-sm grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-medium text-gray-500">Fields</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{fields.length}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-medium text-gray-500">Layouts</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{layouts.length}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-medium text-gray-500">Relationships</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{relationships.length}</dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="font-medium text-gray-500">Access Roles</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{permissions.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFields = () => (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Fields</h3>
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search fields..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center text-sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Field
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort("label")}
                >
                  <div className="flex items-center">
                    Label
                    {sortColumn === "label" && (
                      sortDirection === "asc" 
                        ? <ArrowUp className="h-3 w-3 ml-1" /> 
                        : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    API Name
                    {sortColumn === "name" && (
                      sortDirection === "asc" 
                        ? <ArrowUp className="h-3 w-3 ml-1" /> 
                        : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort("type")}
                >
                  <div className="flex items-center">
                    Type
                    {sortColumn === "type" && (
                      sortDirection === "asc" 
                        ? <ArrowUp className="h-3 w-3 ml-1" /> 
                        : <ArrowDown className="h-3 w-3 ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Required</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Read Only</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">Searchable</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {getSortedFields().map((field) => (
                <tr key={field.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-900 font-medium">{field.label}</td>
                  <td className="px-4 py-3 text-gray-500">{field.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {field.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field.required ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field.readOnly ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {field.searchable ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-800" title="View Field">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800" title="Edit Field">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" title="Delete Field">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {getSortedFields().length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white">
              <ListFilter className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No fields found</h3>
              <p className="mt-2 text-sm">
                {searchTerm 
                  ? "Try adjusting your search terms" 
                  : "Add a field to get started"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLayouts = () => (
    <div className="grid grid-cols-1 gap-6">
      {layouts.map((layout) => (
        <div 
          key={layout.id}
          className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Layout className="h-5 w-5" />
              </div>
              <div className="ml-4 flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{layout.name}</h3>
                  <div className="flex items-center">
                    {layout.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
                        <Check className="h-3 w-3 mr-1" />
                        Default
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {layout.type.charAt(0).toUpperCase() + layout.type.slice(1)} Layout
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-500">
                  {layout.type === 'list' && (
                    <p>This layout controls how records appear in list views.</p>
                  )}
                  {layout.type === 'detail' && (
                    <p>This layout controls how record details are displayed.</p>
                  )}
                  {layout.type === 'edit' && (
                    <p>This layout controls the edit form for records.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800">
                <Eye className="h-4 w-4 mr-1" />
                View
              </button>
              <button className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-800">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            </div>
          </div>
        </div>
      ))}
      
      {layouts.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
          <Layout className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium">No layouts found</h3>
          <p className="mt-2 text-sm">This entity doesn't have any layouts defined yet.</p>
        </div>
      )}
    </div>
  );

  const renderRelationships = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Relationships</h3>
        <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center text-sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Relationship
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Related Entity</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Foreign Key</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {relationships.map((relationship) => (
              <tr key={relationship.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">{relationship.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {relationship.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{relationship.entity || "-"}</td>
                <td className="px-4 py-3 text-gray-500">{relationship.foreignKey || "-"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="text-blue-600 hover:text-blue-800" title="View Relationship">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-800" title="Edit Relationship">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800" title="Delete Relationship">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {relationships.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white">
            <Link2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No relationships found</h3>
            <p className="mt-2 text-sm">
              This entity doesn't have any relationships defined yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPermissions = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Access Control</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure which roles have access to this entity and what operations they can perform.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">View</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Create</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Edit</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Delete</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Export</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Import</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {permissions.map((permission) => (
              <tr key={permission.roleId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                    <span className="font-medium text-gray-900">{permission.roleName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permission.access.view}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {}} // In a real app, you'd handle changes here
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permission.access.create}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {}}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permission.access.edit}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {}}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permission.access.delete}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {}}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permission.access.export}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {}}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={permission.access.import}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    onChange={() => {}}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center text-sm">
          Save Permissions
        </button>
      </div>
    </div>
  );

  // Main render
  return (
    <>
      <SettingsHeader
        title={entity ? entity.displayName : "Entity Details"}
        description={entity ? entity.description : "Loading entity details..."}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/settings/entities")}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Entities
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 inline-flex items-center disabled:opacity-50"
              title="Refresh entity data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />
      
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading entity data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center py-12 text-red-500">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span className="text-lg font-medium">Error loading entity data</span>
            </div>
            <p className="text-sm text-gray-600">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 inline-flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 bg-gray-100 p-1 rounded-lg mb-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="fields" className="data-[state=active]:bg-white data-[state=active]:shadow">
                  Fields ({fields.length})
                </TabsTrigger>
                <TabsTrigger value="layouts" className="data-[state=active]:bg-white data-[state=active]:shadow">
                  Layouts ({layouts.length})
                </TabsTrigger>
                <TabsTrigger value="relationships" className="data-[state=active]:bg-white data-[state=active]:shadow">
                  Relationships ({relationships.length})
                </TabsTrigger>
                <TabsTrigger value="permissions" className="data-[state=active]:bg-white data-[state=active]:shadow">
                  Permissions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview">
                {renderOverview()}
              </TabsContent>
              
              <TabsContent value="fields">
                {renderFields()}
              </TabsContent>
              
              <TabsContent value="layouts">
                {renderLayouts()}
              </TabsContent>
              
              <TabsContent value="relationships">
                {renderRelationships()}
              </TabsContent>
              
              <TabsContent value="permissions">
                {renderPermissions()}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </>
  );
}