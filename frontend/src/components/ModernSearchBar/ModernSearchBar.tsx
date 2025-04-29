'use client';

import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

interface ModernSearchBarProps {
  sidebarOpen: boolean;
}

const ModernSearchBar = ({ sidebarOpen }: ModernSearchBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside to close the search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus the input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      // Simulate search API call
      setLoading(true);
      
      // Mock search results - replace with actual API call
      setTimeout(() => {
        setSearchResults([
          { id: 1, title: 'Αυτοψία #12345', entity: 'Aytopsies1', status: 'Ολοκληρωμένο' },
          { id: 2, title: 'Κατασκευή #67890', entity: 'KataskeyesBFasi', status: 'Σε Εξέλιξη' },
          { id: 3, title: 'Βλάβη #54321', entity: 'Vlaves', status: 'Νέο' }
        ]);
        setLoading(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  return (
    <div 
      ref={searchContainerRef}
      className={`relative ${isOpen ? 'w-full' : 'w-auto'} transition-all duration-200`}
    >
      <div 
        className={`flex items-center h-12 px-4 bg-gray-100 rounded-xl border border-transparent transition-all
          ${isOpen ? 'w-full border-blue-400 shadow-sm bg-white' : 'w-[280px] md:w-[350px] hover:bg-gray-200'}`}
      >
        <Search 
          size={18} 
          className={`text-gray-500 ${isOpen && 'text-blue-500'}`} 
        />
        
        <input
          ref={inputRef}
          type="text"
          placeholder="Αναζήτηση..."
          value={searchQuery}
          onChange={handleSearch}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent border-none outline-none ml-3 text-gray-800 placeholder-gray-500"
        />
        
        {isOpen && searchQuery && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setSearchResults([]);
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
      
      {/* Search Results Dropdown */}
      {isOpen && (searchQuery.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-[350px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="inline-block animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
              Αναζήτηση...
            </div>
          ) : (
            <>
              {searchResults.length > 0 ? (
                <>
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-xs text-gray-500">Αποτελέσματα για "{searchQuery}"</p>
                  </div>
                  
                  <ul>
                    {searchResults.map((result) => (
                      <li key={result.id}>
                        <a 
                          href={`/${result.entity}/${result.id}`}
                          className="block p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-gray-800">{result.title}</p>
                          <div className="flex items-center mt-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 mr-2">
                              {result.entity.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-xs text-gray-500">
                              Κατάσταση: {result.status}
                            </span>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="p-2 bg-gray-50 border-t border-gray-100 text-center">
                    <a href={`/search?q=${encodeURIComponent(searchQuery)}`} className="text-xs text-blue-600 hover:underline">
                      Περισσότερα αποτελέσματα
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p>Δεν βρέθηκαν αποτελέσματα</p>
                  <p className="text-xs mt-1">Δοκιμάστε διαφορετικούς όρους αναζήτησης</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ModernSearchBar;