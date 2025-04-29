"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TokenManager from "@/utils/token-management";

// Define types for user and auth context
type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  isAdmin: boolean;
  loggedInAt: string;
  expiresAt: string;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  // Refresh token function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        console.warn("No refresh token available");
        return false;
      }
      
      console.log("Attempting to refresh token");
      const response = await fetch(`/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        console.error("Token refresh failed:", response.status);
        return false;
      }
      
      const data = await response.json();
      console.log("Token refresh successful");
      
      // Update tokens using TokenManager
      TokenManager.setTokens(data.token, data.refreshToken);
      
      // Update user session
      if (data.user) {
        const userData: User = {
          id: data.user.id,
          username: data.user.userName,
          name: data.user.name,
          role: data.user.role,
          isAdmin: data.user.isAdmin,
          loggedInAt: new Date().toISOString(),
          expiresAt: new Date(data.expiresAt).toISOString(),
          token: data.token,
        };
        
        TokenManager.setUserSession(userData);
        setUser(userData);
      }
      
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  }, []);

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        // Try to load user from session storage
        const userSession = TokenManager.getUserSession();
        const accessToken = TokenManager.getAccessToken();
        
        if (userSession && accessToken) {
          // Check if token is expired
          if (TokenManager.isSessionExpired()) {
            // Try to refresh the token
            console.log("Session expired, attempting to refresh token");
            const refreshed = await refreshToken();
            if (!refreshed) {
              console.log("Token refresh failed, logging out");
              TokenManager.clearAuthData();
              setUser(null);
            }
          } else {
            console.log("Valid session found, setting user");
            setUser(userSession);
            
            // Proactively refresh if token will expire soon
            if (TokenManager.willExpireSoon()) {
              console.log("Token will expire soon, refreshing proactively");
              refreshToken().catch(console.error);
            }
          }
        } else {
          console.log("No user session or token found");
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
    
    // Setup token refresh interval
    const refreshInterval = setInterval(() => {
      if (TokenManager.isAuthenticated() && TokenManager.willExpireSoon()) {
        console.log("Token refresh interval triggered");
        refreshToken().catch(console.error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [refreshToken]);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log("Attempting login with username:", username);
      const response = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid username or password.");
      }

      const data = await response.json();
      console.log("Login successful, received tokens");
      
      // Store tokens
      TokenManager.setTokens(data.token, data.refreshToken);
      
      // Store user info
      const userData: User = {
        id: data.user.id,
        username: data.user.userName,
        name: data.user.name,
        role: data.user.role,
        isAdmin: data.user.isAdmin,
        loggedInAt: new Date().toISOString(),
        expiresAt: new Date(data.expiresAt).toISOString(),
        token: data.token,
      };
      
      TokenManager.setUserSession(userData);
      setUser(userData);
      
      console.log("User data stored, redirecting to home");
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const handleLogout = () => {
    console.log("Logging out");
    
    // Get token for logout request
    const token = TokenManager.getAccessToken();
    
    // Clear all auth data first
    TokenManager.clearAuthData();
    setUser(null);
    
    // Make a logout request to the server if we have a token
    if (token) {
      fetch(`/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(err => console.error("Logout error:", err));
    }
    
    router.push("/auth/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout: handleLogout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};