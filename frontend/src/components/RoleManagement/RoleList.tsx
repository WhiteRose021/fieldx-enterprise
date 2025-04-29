"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@/types/rbac";
import Pagination from "@/components/Pagination/Pagination";
import LoadingScreen from "@/components/LoadingScreen";

interface RoleListProps {
  limit?: number;
  showActions?: boolean;
}

export default function RoleList({ limit = 10, showActions = true }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  
  // Fetch roles data
  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      try {
        const offset = (page - 1) * limit;
        const response = await fetch(`/api/roles?limit=${limit}&offset=${offset}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching roles: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRoles(data.list || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch roles");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRoles();
  }, [page, limit]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle role selection
  const handleRoleSelect = (roleId: string) => {
    router.push(`/settings/roles/${roleId}`);
  };
  
  // Handle role deletion
  const handleDeleteRole = async (roleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm("Are you sure you want to delete this role?")) {
      try {
        const response = await fetch(`/api/roles/${roleId}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error(`Error deleting role: ${response.statusText}`);
        }
        
        // Refresh the list
        setRoles(roles.filter(role => role.id !== roleId));
        setTotal(prev => prev - 1);
      } catch (err) {
        console.error("Failed to delete role:", err);
        setError(err instanceof Error ? err.message : "Failed to delete role");
      }
    }
  };
  
  // Handle creating a new role
  const handleCreateRole = () => {
    router.push("/settings/roles/new");
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
  
  // Format date function to handle string dates properly
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    
    try {
      // Ensure we're working with a valid date string
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid date';
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">Roles</h2>
        {showActions && (
          <button
            onClick={handleCreateRole}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Role
          </button>
        )}
      </div>
      
      {roles.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No roles found.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modified At
                  </th>
                  {showActions && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr 
                    key={role.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRoleSelect(role.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{role.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(role.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(role.modifiedAt)}
                      </div>
                    </td>
                    {showActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => handleDeleteRole(role.id, e)}
                          className="text-red-600 hover:text-red-900 ml-3"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {total > limit && (
            <div className="px-4 py-3 border-t">
              <Pagination
                currentPage={page}
                itemsPerPage={limit}
                onPageChange={handlePageChange}
                totalPages={Math.ceil(total / limit)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}