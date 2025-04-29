'use client';

import React, { useState, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import ModernSearchBar from '@/components/ModernSearchBar/ModernSearchBar';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface LogoProps {
  isCollapsed: boolean;
}

// Memoize the Logo component with proper TypeScript interface
const Logo = memo(({ isCollapsed }: LogoProps) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox={isCollapsed ? "50 55 160 160" : "0 0 500 200"}
      className={`transition-all duration-300 ${isCollapsed ? 'w-14 h-14' : 'w-64 h-20'}`}
    >
      <g transform={isCollapsed ? "translate(30, 20)" : "translate(20, 20)"}>
        <path 
          d="M20,40 L100,40 L100,60 L60,60 L60,140 L40,140 L40,60 L20,60 Z" 
          fill="#ffffff"
        />
        <path 
          d="M80,90 L140,140 M140,90 L80,140" 
          stroke="#ffffff" 
          strokeWidth="20" 
          strokeLinecap="round"
        />
        
        {!isCollapsed && (
          <>
            <text 
              x="200" 
              y="100" 
              fontFamily="Arial" 
              fontWeight="700" 
              fontSize="60" 
              fill="#ffffff"
            >
              FIELDX
            </text>
            <text 
              x="182" 
              y="130" 
              fontFamily="Arial" 
              fontSize="16" 
              fill="#ffffff"
              opacity="0.8"
            >
              FIBER NETWORK SOLUTIONS
            </text>
          </>
        )}
      </g>
    </svg>
  );
});

Logo.displayName = 'Logo';

// Create a memoized dropdowns component
const HeaderDropdowns = memo(() => {
  return (
    <div className="flex items-center gap-1 lg:gap-2">
      <div className="px-1 lg:px-2">
        <DropdownNotification />
      </div>
      <div className="px-1 lg:px-2">
        <DropdownUser />
      </div>
    </div>
  );
});

HeaderDropdowns.displayName = 'HeaderDropdowns';

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      console.log('Header component unmounting');
    };
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-999 flex bg-[#FFFFFF] shadow-sm">
      <div className="flex w-full">
        {/* Logo Section - Using the exact same width as sidebar */}
        <div 
          className={`flex h-[95px] shrink-0 items-center justify-center bg-[#000000] transition-all duration-300 ease-in-out border-r border-black/10
            ${!sidebarOpen ? "w-20" : "w-72.5"}`}
        >
          <Link href="/" className="flex items-center justify-center w-full">
            <Logo isCollapsed={!sidebarOpen} />
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex h-[95px] flex-1">
          <div className="flex w-full items-center justify-between pl-2 md:pl-4 lg:pl-6 pr-1 md:pr-2 lg:pr-4">
            {/* Left space - smaller on narrow screens */}
            <div className="flex-shrink-0 w-0 md:w-2 lg:w-4" />

            {/* Centered Search Bar with responsive width */}
            <div className="flex-1 px-1 md:px-2 lg:px-4">
              <ModernSearchBar sidebarOpen={sidebarOpen} />
            </div>

            {/* Right Side Items - ensure this takes only necessary space */}
            <div className="flex-shrink-0 ml-1 md:ml-2 lg:ml-4">
              <HeaderDropdowns />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default memo(Header);