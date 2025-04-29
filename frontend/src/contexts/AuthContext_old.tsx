"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import TokenManager from "@/utils/token-management";

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  isAdmin: boolean;
  loggedInAt: string;
  expiresAt: string;
  token?: string; // Add token to user session
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
  const pathname = usePathname();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Check for existing session on initialization
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // Try to load user from session storage
        const userSession = TokenManager.getUserSession();
        
        if (userSession) {
          // Check if session is expired
          if (new Date(userSession.expiresAt) <= new Date()) {
            // Try to refresh the token
            console.log("Session expired, attempting to refresh token");
            const refreshed = await refreshToken();
            if (!refreshed) {
              console.log("Token refresh failed, logging out");
              handleLogout();
              return;
            }
          } else {
            console.log("Valid session found, setting user");
            setUser(userSession);
          }
        } else {
          console.log("No user session found");
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
  }, []);

  // Redirect based on auth status
  useEffect(() => {
    if (!isLoading) {
      const isAuthRoute = pathname?.startsWith("/auth");
      
      if (!user && !isAuthRoute && pathname !== "/") {
        console.log("Not authenticated, redirecting to signin");
        router.push("/auth/signin");
      } else if (user && isAuthRoute) {
        console.log("Already authenticated, redirecting to home");
        router.push("/");
      }
    }
  }, [user, isLoading, pathname, router]);

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
      
      // Store refresh token in localStorage
      localStorage.setItem("refresh_token", data.refreshToken);
      
      // Store access token in localStorage
      localStorage.setItem("access_token", data.token);
      
      // Store user info AND token in sessionStorage
      const userData: User = {
        id: data.user.id,
        username: data.user.userName,
        name: data.user.name,
        role: data.user.role,
        isAdmin: data.user.isAdmin,
        loggedInAt: new Date().toISOString(),
        expiresAt: new Date(data.expiresAt).toISOString(),
        token: data.token, // Store the JWT token for API requests
      };
      
      // Use the TokenManager to set the user session
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

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      
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
      
      // Update refresh token
      localStorage.setItem("refresh_token", data.refreshToken);
      
      // Update access token
      localStorage.setItem("access_token", data.token);
      
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
          token: data.token, // Store the new JWT token
        };
        
        TokenManager.setUserSession(userData);
        setUser(userData);
      }
      
      return true;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  const handleLogout = () => {
    console.log("Logging out");
    // Use TokenManager to clear all auth data
    TokenManager.clearAuthData();
    
    // Make a logout request to the server
    fetch(`/api/auth/logout`, {
      method: "POST",
    }).catch(err => console.error("Logout error:", err));
    
    setUser(null);
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