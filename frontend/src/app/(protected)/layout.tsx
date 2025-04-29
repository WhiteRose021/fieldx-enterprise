"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import TokenManager from "@/utils/token-management";

export default function AuthenticatedLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const { user, isLoading, isAuthenticated, refreshToken } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated, redirecting to login");
      router.replace("/auth/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  // Restore sidebar state and set mounted flag
  useEffect(() => {
    setMounted(true);
    
    // Try to restore sidebar state from localStorage on initial mount
    try {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setSidebarOpen(savedState !== 'true');
      } else {
        // Default state based on screen size
        setSidebarOpen(window.innerWidth >= 1024);
      }
    } catch (e) {
      console.error('Error loading sidebar state:', e);
      // Default fallback
      setSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  // Save sidebar state when it changes
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('sidebarCollapsed', String(!sidebarOpen));
      } catch (e) {
        console.error('Error saving sidebar state:', e);
      }
    }
  }, [sidebarOpen, mounted]);

  // Proactively refresh token when needed
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const checkTokenExpiration = () => {
        if (TokenManager.willExpireSoon()) {
          console.log("Token will expire soon, refreshing...");
          refreshToken().catch(console.error);
        }
      };
      
      // Check immediately
      checkTokenExpiration();
      
      // And set up interval
      const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000); // Every 5 minutes
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, isLoading, refreshToken]);

  // Show loading screen while checking auth or before component is mounted
  if (isLoading || !mounted) {
    return <LoadingScreen />;
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        currentPath={pathname || ""}
      />

      <div 
        className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden transition-all duration-300"
        style={{ 
          marginLeft: sidebarOpen ? "256px" : "80px" 
        }}
      >
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
        />

        <main className="flex-grow p-4 md:p-6 lg:p-8 pt-[95px]">
          {children}
        </main>

        <footer className="py-4 px-6 text-center text-sm text-gray-600 border-t border-gray-200">
          <p>© 2025 FieldX Enterprise. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}