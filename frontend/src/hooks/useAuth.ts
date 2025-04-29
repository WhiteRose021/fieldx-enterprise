"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UserSession {
  id: string;
  username: string;
  name: string;
  role: string;
  isAdmin: boolean;
  loggedInAt: string;
  expiresAt: string;
}

interface UseAuthReturn {
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Check if token is expired
  const isTokenExpired = (expiresAt: string): boolean => {
    return new Date(expiresAt) <= new Date();
  };

  // Refresh the access token using refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        return false;
      }
      
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      // Update the access token
      localStorage.setItem('auth_token', data.token);
      
      // Update token expiry in user session
      const userSession = sessionStorage.getItem('user_session');
      
      if (userSession) {
        const parsedSession = JSON.parse(userSession);
        parsedSession.expiresAt = new Date(data.expiresAt).toISOString();
        sessionStorage.setItem('user_session', JSON.stringify(parsedSession));
        
        // Update user state
        setUser(parsedSession);
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [API_URL]);

  // Check authentication status
  const checkAuth = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Check for user session
      const userSession = sessionStorage.getItem('user_session');
      
      if (!userSession) {
        setIsLoading(false);
        return false;
      }
      
      const parsedSession: UserSession = JSON.parse(userSession);
      
      // Check if token is expired
      if (isTokenExpired(parsedSession.expiresAt)) {
        // Try to refresh the token
        const refreshed = await refreshToken();
        
        if (!refreshed) {
          // If refresh failed, log out
          await logout(false);
          setIsLoading(false);
          return false;
        }
      }
      
      // Validate token with backend
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setIsLoading(false);
        return false;
      }
      
      const response = await fetch(`${API_URL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Invalid authentication');
      }
      
      // Token is valid, update user state
      setUser(parsedSession);
      setIsLoading(false);
      return true;
      
    } catch (error) {
      console.error('Authentication error:', error);
      // Clear auth data
      await logout(false);
      setIsLoading(false);
      return false;
    }
  }, [refreshToken]);

  // Logout function
  const logout = useCallback(async (redirect = true) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        // Call logout endpoint
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        }).catch(error => {
          console.error('Error logging out:', error);
        });
      }
    } finally {
      // Clear auth data regardless of API success
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user_session');
      
      // Clear cookies
      document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict;';
      document.cookie = 'is_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=strict;';
      
      // Reset state
      setUser(null);
      
      // Redirect to login page
      if (redirect) {
        router.push('/auth/signin');
      }
    }
  }, [API_URL, router]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin: user?.isAdmin || false,
    logout,
    checkAuth,
  };
};