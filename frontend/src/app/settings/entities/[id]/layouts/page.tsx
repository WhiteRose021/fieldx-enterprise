"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SettingsHeader from "../../../components/SettingsHeader";
import { EntityService } from "@/services/entity-service";
import { EntityDefinition, LayoutDefinition } from "@/types/entity-management";
import {
  Layout, Edit, Eye, Trash2, AlertCircle,
  Plus, Loader2, ArrowLeft, Check, Calendar, List, Grid
} from "lucide-react";

export default function EntityLayoutsPage() {
  const params = useParams();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityDefinition | null>(null);
  const [layouts, setLayouts] = useState<LayoutDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const entityId = params.id as string;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load entity and layouts in parallel
        const [entityData, layoutsData] = await Promise.all([
          EntityService.getEntityById(entityId),
          EntityService.getEntityLayouts(entityId)
        ]);
        
        if (!entityData) {
          setError("Entity not found");
          return;
        }
        
        setEntity(entityData);
        setLayouts(layoutsData);
        setError(null);
      } catch (err) {
        setError("Failed to load entity layouts");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      loadData();
    }
  }, [entityId]);

  // Helper function to get the appropriate icon for layout type
  const getLayoutIcon = (type: string) => {
    switch (type) {
      case 'list':
        return <List className="h-5 w-5" />;
      case 'grid':
        return <Grid className="h-5 w-5" />;
      case 'detail':
      case 'edit':
        return <Layout className="h-5 w-5" />;
      default:
        return <Layout className="h-5 w-5" />;
    }
  };

  return (
    <>
      <SettingsHeader
        title={`Layouts: ${entity?.displayName || 'Loading...'}`}
        description="Configure how data is displayed in lists, detail views, and forms"
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
              href={`/settings/entities/${entityId}/layouts/new`} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Layout
            </Link>
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
          <div className="grid grid-cols-1 gap-6">
            {layouts.map((layout) => (
              <div 
                key={layout.id}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      {getLayoutIcon(layout.type)}
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
                      <div className="mt-2 flex flex-wrap gap-2">
                        {layout.type === 'list' && 
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{layout.data.columns?.length || 0}</span> Columns
                          </div>
                        }
                        {layout.type === 'grid' && 
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{layout.data.columns || 0}</span> Column Grid
                          </div>
                        }
                        {layout.data.filters && 
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{layout.data.filters.length}</span> Filters
                          </div>
                        }
                        {layout.data.actions && 
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{layout.data.actions.length}</span> Actions
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                  <div className="flex justify-end gap-3">
                    <Link
                      href={`/settings/entities/${entityId}/layouts/${layout.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>
                    <Link
                      href={`/settings/entities/${entityId}/layouts/${layout.id}/edit`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-800"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                    {!layout.isDefault && (
                      <button
                        onClick={() => {
                          // Would show a confirmation modal in a real implementation
                          alert(`Would delete layout: ${layout.name}`);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {layouts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Layout className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium">No layouts found</h3>
                <p className="mt-2">
                  Create a new layout to customize how this entity is displayed
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}