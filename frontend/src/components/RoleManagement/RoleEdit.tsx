"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role, PermissionLevel, EntityPermissions } from "@/types/rbac";
import LoadingScreen from "@/components/LoadingScreen";

interface RoleEditProps {
  roleId?: string;
}

const permissionLevels: PermissionLevel[] = ["all", "team", "own", "no", "not-set"];

const permissionLabels: Record<PermissionLevel, string> = {
  "all": "All",
  "team": "Team",
  "own": "Own",
  "no": "No Access",
  "not-set": "Not Set"
};

export default function RoleEdit({ roleId }: RoleEditProps) {
  const isNew = !roleId;
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [entityPermissions, setEntityPermissions] = useState<Record<string, EntityPermissions>>({});
  const [entities, setEntities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Fetch role and entity metadata
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch entity metadata first
        const metadataResponse = await fetch("/api/metadata/entities");
        if (!metadataResponse.ok) {
          throw new Error(`Error fetching entity metadata: ${metadataResponse.statusText}`);
        }
        
        const metadataData = await metadataResponse.json();
        const entityTypes = Object.keys(metadataData).sort();
        setEntities(entityTypes);
        
        // Initialize empty permissions for all entities
        const initialPermissions: Record<string, EntityPermissions> = {};
        entityTypes.forEach(entity => {
          initialPermissions[entity] = {
            create: "not-set",
            read: "not-set",
            edit: "not-set",
            delete: "not-set"
          };
        });
        
        // If editing existing role, fetch its details
        if (roleId) {
          const roleResponse = await fetch(`/api/roles/${roleId}`);
          if (!roleResponse.ok) {
            throw new Error(`Error fetching role: ${roleResponse.statusText}`);
          }
          
          const roleData = await roleResponse.json();
          setRole(roleData);
          setName(roleData.name);
          
          // Merge existing permissions with initialized ones
          const rolePermissions = { ...initialPermissions };
          
          if (roleData.data) {
            for (const entity in roleData.data) {
              if (rolePermissions[entity]) {
                rolePermissions[entity] = {
                  ...rolePermissions[entity],
                  ...roleData.data[entity]
                };
              } else {
                rolePermissions[entity] = roleData.data[entity];
              }
            }
          }
          
          setEntityPermissions(rolePermissions);
        } else {
          // For new role, use the initialized permissions
          setEntityPermissions(initialPermissions);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [roleId]);
  
  // Handle permission change
  const handlePermissionChange = (
    entity: string,
    action: keyof EntityPermissions,
    value: PermissionLevel
  ) => {
    setEntityPermissions(prev => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [action]: value
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    
    try {
      const payload = {
        name,
        data: entityPermissions
      };
      
      const url = isNew ? "/api/roles" : `/api/roles/${roleId}`;
      const method = isNew ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${isNew ? "creating" : "updating"} role`);
      }
      
      // Navigate back to roles list
      router.push("/settings/roles");
    } catch (err) {
      console.error(`Failed to ${isNew ? "create" : "update"} role:`, err);
      setSaveError(err instanceof Error ? err.message : `Failed to ${isNew ? "create" : "update"} role`);
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) return <LoadingScreen />;
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md mb-4">
        <p className="text-red-700">Error: {error}</p>
        <button 
          className="mt-2 text-red-600 underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">
          {isNew ? "Create New Role" : `Edit Role: ${role?.name}`}
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        {saveError && (
          <div className="bg-red-50 p-4 border-b border-red-100">
            <p className="text-red-700">Error: {saveError}</p>
          </div>
        )}
        
        <div className="p-6">
          <div className="mb-6">
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
              Role Name *
            </label>
            <input
              id="roleName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mt-8">
            <h3 className="text-md font-medium text-gray-700 mb-4">Entity Permissions</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Create
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Read
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Edit
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entities.map((entity) => (
                    <tr key={entity}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{entity}</div>
                      </td>
                      {["create", "read", "edit", "delete"].map((action) => (
                        <td key={`${entity}-${action}`} className="px-6 py-4 whitespace-nowrap text-center">
                          <select
                            value={entityPermissions[entity]?.[action as keyof EntityPermissions] || "not-set"}
                            onChange={(e) => 
                              handlePermissionChange(
                                entity, 
                                action as keyof EntityPermissions, 
                                e.target.value as PermissionLevel
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          >
                            {permissionLevels.map((level) => (
                              <option key={level} value={level}>
                                {permissionLabels[level]}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/settings/roles")}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 mr-3"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : isNew ? "Create Role" : "Update Role"}
          </button>
        </div>
      </form>
    </div>
  );
}