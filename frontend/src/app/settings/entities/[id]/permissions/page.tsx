"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SettingsHeader from "../../../components/SettingsHeader";
import { EntityService } from "@/services/entity-service";
import { EntityDefinition } from "@/types/entity-management";
import {
  Shield, Loader2, AlertCircle, ArrowLeft, 
  Check, X, Eye, Edit, Trash2, Save, Info,
  Plus
} from "lucide-react";

// Role type definition
interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

// Permission type definition
interface Permission {
  roleId: string;
  entityId: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  import: boolean;
}

export default function EntityPermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityDefinition | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const entityId = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, you would fetch the entity, roles, and permissions
        // For now, we'll use dummy data
        const entityData = await EntityService.getEntityById(entityId);
        
        if (!entityData) {
          setError("Entity not found");
          return;
        }
        
        setEntity(entityData);
        
        // Dummy roles data
        const dummyRoles: Role[] = [
          { id: "admin", name: "Administrator", isSystem: true },
          { id: "manager", name: "Manager", isSystem: false },
          { id: "user", name: "Regular User", isSystem: false },
          { id: "guest", name: "Guest", isSystem: true }
        ];
        
        setRoles(dummyRoles);
        
        // Dummy permissions data
        const dummyPermissions: Record<string, Permission> = {
          "admin": {
            roleId: "admin",
            entityId: entityId,
            view: true,
            create: true,
            edit: true,
            delete: true,
            export: true,
            import: true
          },
          "manager": {
            roleId: "manager",
            entityId: entityId,
            view: true,
            create: true,
            edit: true,
            delete: false,
            export: true,
            import: false
          },
          "user": {
            roleId: "user",
            entityId: entityId,
            view: true,
            create: false,
            edit: false,
            delete: false,
            export: false,
            import: false
          },
          "guest": {
            roleId: "guest",
            entityId: entityId,
            view: false,
            create: false,
            edit: false,
            delete: false,
            export: false,
            import: false
          }
        };
        
        setPermissions(dummyPermissions);
        setError(null);
      } catch (err) {
        setError("Failed to load permissions data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      loadData();
    }
  }, [entityId]);

  const handlePermissionChange = (roleId: string, permission: keyof Permission, value: boolean) => {
    if (permissions[roleId]) {
      setPermissions(prev => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          [permission]: value
        }
      }));
    }
  };

  const handleSavePermissions = async () => {
    try {
      setIsSaving(true);
      
      // In a real implementation, this would send the permissions to the API
      console.log("Saving permissions:", permissions);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message (in a real app, you would use a toast or notification)
      alert("Permissions saved successfully");
    } catch (err) {
      console.error("Failed to save permissions:", err);
      alert("Failed to save permissions");
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to determine if a role has access to more sensitive operations
  const canAccessSensitiveOperations = (rolePermission: Permission) => {
    return rolePermission.edit || rolePermission.delete || rolePermission.import;
  };

  return (
    <>
      <SettingsHeader
        title={`Permissions: ${entity?.displayName || 'Loading...'}`}
        description="Configure access control and visibility for this entity"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/settings/entities/${entityId}`)}
              className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Entity
            </button>
            <button 
              onClick={handleSavePermissions}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Permissions
                </>
              )}
            </button>
          </div>
        }
      />
      <div className="p-6">
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
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">About Permissions</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Configure which roles can access this entity and what operations they can perform. 
                  Permissions are cumulative, so users with multiple roles will have the combined permissions of all their roles.
                </p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                        Role
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        View
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Create
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Edit
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Delete
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Export
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Import
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles.map((role) => (
                      <tr key={role.id} className={role.isSystem ? "bg-gray-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 flex-shrink-0 rounded-md bg-blue-100 flex items-center justify-center text-blue-600">
                              <Shield className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{role.name}</div>
                              {role.isSystem && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  System Role
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={permissions[role.id]?.view || false}
                              onChange={(e) => handlePermissionChange(role.id, "view", e.target.checked)}
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={permissions[role.id]?.create || false}
                              onChange={(e) => handlePermissionChange(role.id, "create", e.target.checked)}
                              disabled={!permissions[role.id]?.view}
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={permissions[role.id]?.edit || false}
                              onChange={(e) => handlePermissionChange(role.id, "edit", e.target.checked)}
                              disabled={!permissions[role.id]?.view}
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={permissions[role.id]?.delete || false}
                              onChange={(e) => handlePermissionChange(role.id, "delete", e.target.checked)}
                              disabled={!permissions[role.id]?.view || role.id === "guest"}
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={permissions[role.id]?.export || false}
                              onChange={(e) => handlePermissionChange(role.id, "export", e.target.checked)}
                              disabled={!permissions[role.id]?.view}
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                              checked={permissions[role.id]?.import || false}
                              onChange={(e) => handlePermissionChange(role.id, "import", e.target.checked)}
                              disabled={!permissions[role.id]?.view || role.id === "guest"}
                            />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-6 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Role Access Summary</h3>
                <div className="space-y-4">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-start">
                      <div className="h-8 w-8 flex-shrink-0 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 mt-1">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                        <p className="mt-1 text-sm text-gray-500">
                          {!permissions[role.id]?.view ? (
                            "No access to this entity"
                          ) : !canAccessSensitiveOperations(permissions[role.id]) ? (
                            "Can view and export data only"
                          ) : permissions[role.id]?.delete ? (
                            "Full access with delete capabilities"
                          ) : (
                            "Can view, create, and edit, but not delete"
                          )}
                        </p>
                        
                        <div className="mt-2 flex flex-wrap gap-2">
                          {permissions[role.id]?.view && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </span>
                          )}
                          
                          {permissions[role.id]?.create && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Plus className="h-3 w-3 mr-1" />
                              Create
                            </span>
                          )}
                          
                          {permissions[role.id]?.edit && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </span>
                          )}
                          
                          {permissions[role.id]?.delete && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}