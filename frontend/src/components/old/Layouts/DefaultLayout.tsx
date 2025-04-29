'use client';

import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "../Header";

export default function DefaultLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  // Stable state updater function
  const toggleSidebar = useMemo(() => 
    (value: boolean) => setSidebarOpen(value),
  []);
  
  useEffect(() => {
    // Set mounted on client-side only
    setMounted(true);
    
    // Handle screen size changes
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Cleanup
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Memoize the header to prevent recreation
  const headerComponent = useMemo(() => (
    <Header 
      sidebarOpen={sidebarOpen} 
      setSidebarOpen={toggleSidebar} 
    />
  ), [sidebarOpen, toggleSidebar]);

  // Early return for server-side rendering
  if (!mounted) {
    return (
      <div className="dark:bg-boxdark-2 dark:text-bodydark flex h-screen overflow-hidden">
        {/* Loading placeholder if needed */}
      </div>
    );
  }

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={toggleSidebar} />

      <div
        className="relative flex flex-1 flex-col transition-all duration-300 custom-scrollbar"
        id="main-content"
        style={{ marginLeft: sidebarOpen ? "256px" : "80px" }}
      >
        {/* Use memoized header */}
        {headerComponent}

        <main className="relative h-[calc(100vh-64px)] overflow-y-auto bg-white-50">
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            {children}
          </div>  
        </main>
      </div>
    </div>
  );
}