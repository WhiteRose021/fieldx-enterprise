"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader, Phone, User, MapPin, AlertCircle, Building } from 'lucide-react';
import Link from 'next/link';
import { Inter } from 'next/font/google';

// Import the Inter font
const inter = Inter({ subsets: ['greek', 'latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

interface ModernSearchBarProps {
  sidebarOpen: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  customerName?: string;
  customerMobile?: string;
  aDDRESSStreet?: string;
  aDDRESSCity?: string;
}

const ModernSearchBar: React.FC<ModernSearchBarProps> = ({ sidebarOpen }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setIsFocused(false);
      }
    };

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const searchAutopsies = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const authToken = localStorage.getItem("auth_token");
      if (!authToken) throw new Error("No auth token found");

      const params = {
        maxSize: 10,
        offset: 0,
        where: [{
          type: "or",
          value: [
            {
              type: "contains",
              attribute: "name",
              value: query
            },
            {
              type: "contains",
              attribute: "customerName",
              value: query
            },
            {
              type: "contains",
              attribute: "customerMobile",
              value: query
            },
            {
              type: "contains",
              attribute: "aDDRESSStreet",
              value: query
            },
            {
              type: "contains",
              attribute: "aDDRESSCity",
              value: query
            }
          ]
        }]
      };

      const queryString = `searchParams=${encodeURIComponent(JSON.stringify(params))}`;
      
      const response = await fetch(
        `http://192.168.4.150:8080/api/v1/Aytopsies1?${queryString}`,
        {
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data.list || []);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue) {
        searchAutopsies(searchValue);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const handleClear = () => {
    setSearchValue('');
    setResults([]);
    setShowResults(false);
    setIsFocused(false);
  };

  const handleResultClick = () => {
    handleClear();
  };

  // Get responsive placeholder text based on screen width
  const getPlaceholder = () => {
    if (windowWidth < 640) {
      return "Αναζήτηση...";
    } else if (windowWidth < 1024) {
      return "Αναζήτηση SR, όνομα πελάτη...";
    } else {
      return "Αναζήτηση SR, όνομα πελάτη, αριθμό τηλεφώνου, διεύθυνση...";
    }
  };

  return (
    <div className={`relative w-full ${inter.className}`} ref={searchRef}>
      {/* Responsive container - adjust width based on screen size and sidebar state */}
      <div className={`transition-all duration-300 mx-auto w-full 
        ${sidebarOpen 
          ? 'max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[600px] xl:max-w-[720px]' 
          : 'max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[700px] xl:max-w-[800px]'
        }`}>
        <div className="relative w-full group">
          {/* Search Input */}
          <div 
            className={`relative flex items-center overflow-hidden rounded-lg
              transition-all duration-300 ease-in-out border shadow-sm search-focused
              ${isFocused 
                ? 'bg-white border-blue-600 shadow-md ring-2 ring-blue-100' 
                : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
          >
            <div className="absolute left-2 sm:left-3 md:left-4 flex items-center justify-center">
              {isLoading ? (
                <Loader className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 animate-spin" />
              ) : (
                <Search className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300
                  ${isFocused ? 'text-blue-600' : 'text-gray-500'}`}
                />
              )}
            </div>
            
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={getPlaceholder()}
              className={`w-full py-2.5 sm:py-3 md:py-3.5 pl-8 sm:pl-10 md:pl-12 pr-8 sm:pr-10 md:pr-12 bg-transparent
                text-sm sm:text-[14px] md:text-[15px] text-gray-800 font-medium font-inter placeholder:text-gray-400
                focus:outline-none focus:ring-0
                transition-all duration-200`}
              onFocus={() => {
                setIsFocused(true);
                setShowResults(true);
              }}
            />
            
            {searchValue && (
              <button
                onClick={handleClear}
                className="absolute right-2 sm:right-3 md:right-4 p-1 sm:p-1.5 rounded-full 
                  hover:bg-gray-100 transition-all duration-200"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              </button>
            )}
          </div>
  
          {/* Search Results Dropdown */}
          {showResults && (searchValue || isLoading) && (
            <div className="absolute left-0 right-0 mt-1 sm:mt-2 bg-white rounded-lg shadow-xl 
              border border-gray-200 overflow-hidden animate-fadeIn z-50"
            >
              {isLoading ? (
                <div className="p-3 sm:p-4 md:p-5 text-center font-inter flex items-center justify-center gap-2 sm:gap-3">
                  <Loader size={16} className="text-blue-600 animate-spin" />
                  <span className="text-xs sm:text-sm text-gray-600">Αναζήτηση σε εξέλιξη...</span>
                </div>
              ) : results.length > 0 ? (
                <div>
                  <div className="border-b border-gray-200 py-1.5 sm:py-2 px-3 sm:px-4 bg-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-inter">Βρέθηκαν {results.length} αποτελέσματα</span>
                    <span className="text-xs text-blue-600 font-medium font-inter cursor-pointer hover:underline">Προβολή όλων</span>
                  </div>
                  <ul className="max-h-[320px] sm:max-h-[400px] md:max-h-[480px] overflow-auto
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-gray-50
                    [&::-webkit-scrollbar-thumb]:bg-blue-300
                    [&::-webkit-scrollbar-thumb]:rounded-full"
                  >
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/FTTHBPhase/Autopsies/${result.id}`}
                      onClick={handleResultClick}
                    >
                      <li className="px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 hover:bg-blue-50 cursor-pointer
                        border-b border-gray-100 last:border-0 
                        transition-colors duration-150"
                      >
                        <div className="flex flex-col space-y-1.5 sm:space-y-2">
                          {/* SR Number */}
                          <div className="flex items-center">
                            <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-xs sm:text-[13px] 
                              font-medium text-white rounded font-inter">
                              SR: {result.name}
                            </span>
                          </div>
                          
                          {/* Customer Name and Mobile */}
                          <div className="flex items-center gap-3 sm:gap-4 md:gap-6 flex-wrap">
                            {result.customerName && (
                              <span className="text-xs sm:text-[13px] font-medium text-gray-800 font-inter">
                                {result.customerName}
                              </span>
                            )}
                            {result.customerMobile && (
                              <span className="text-xs sm:text-[13px] text-gray-600 font-inter">
                                {result.customerMobile}
                              </span>
                            )}
                          </div>
                          
                          {/* Address with dot */}
                          {result.aDDRESSStreet && (
                            <div className="text-xs sm:text-[13px] text-gray-500 flex items-center gap-1.5 sm:gap-2 font-inter">
                              <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-blue-600"></span>
                              <span className="truncate">{result.aDDRESSStreet}</span>
                            </div>
                          )}
                        </div>
                      </li>
                    </Link>
                  ))}
                  </ul>
                </div>
              ) : searchValue.trim() ? (
                <div className="p-3 sm:p-4 md:p-5 flex items-center justify-center gap-2 sm:gap-3">
                  <AlertCircle size={16} className="text-yellow-500" />
                  <span className="text-xs sm:text-sm text-gray-600 font-inter">Δεν βρέθηκαν αποτελέσματα για "{searchValue}"</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        @keyframes pulseBlue {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.2); }
          50% { box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2); }
        }
        
        .search-focused:focus-within {
          animation: pulseBlue 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ModernSearchBar;