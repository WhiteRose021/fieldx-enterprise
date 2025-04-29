// hooks/useStorage.ts
import { useState, useCallback } from 'react';
import type { ProductWithStock, ProductFormData, ProductUpdateData, ApiResponse } from '@/types/storage';

export const useStorage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (
    category?: string,
    search?: string
  ): Promise<ProductWithStock[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (search) params.append('search', search);
      
      const response = await fetch(`/api/storage/products?${params}`);
      const result: ApiResponse<ProductWithStock[]> = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Failed to fetch products');
      if (!result.data) throw new Error('No data received');
      
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (data: ProductFormData): Promise<ProductWithStock | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/storage/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ProductWithStock> = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Failed to create product');
      if (!result.data) throw new Error('No data received');

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProduct = useCallback(async (
    id: number,
    data: ProductUpdateData
  ): Promise<ProductWithStock | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/storage/products?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ProductWithStock> = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Failed to update product');
      if (!result.data) throw new Error('No data received');

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/storage/products?id=${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<{ success: boolean }> = await response.json();
      
      if (!response.ok) throw new Error(result.error?.message || 'Failed to delete product');
      if (!result.data) throw new Error('No data received');

      return result.data.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};