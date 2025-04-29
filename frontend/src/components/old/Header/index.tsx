'use client';

import React, { useState, useEffect, useMemo, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import DropdownNotification from "./DropdownNotification";
import DropdownUser from "./DropdownUser";
import ModernSearchBar from '@/components/ModernSearchBar/ModernSearchBar';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (arg: boolean) => void;
}

interface LogoProps {
  sidebarOpen: boolean;
}

// Memoize the Logo component that changes based on sidebar state
const Logo = memo(({ sidebarOpen }: LogoProps) => {
  return (
    <div className="w-64 h-20">
      <div className="relative w-64 h-20">
        <Image
          src={sidebarOpen ? "/images/fieldx-logo.png" : "/images/logo-white.png"}
          alt="FieldX Logo"
          fill
          sizes="(max-width: 768px) 100vw, 256px"
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
    </div>
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
    <header className="fixed left-0 right-0 top-0 z-999 flex flex-col bg-[#FFFFFF] shadow-sm">
      <div className="flex w-full">
        {/* Logo Section - Removed border-r */}
        <div 
          className={`flex h-[95px] w-72.5 shrink-0 items-center justify-center transition-colors duration-300
            ${sidebarOpen ? 'bg-[#000000]' : 'bg-aspro'}`}
        >
          <Link href="/" className="flex items-center justify-center w-full">
            <Logo sidebarOpen={sidebarOpen} />
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
      
      {/* Thin line to separate header from body content */}
      <div className="h-px w-full bg-[#000000]"></div>
    </header>
  );
};

export default memo(Header);