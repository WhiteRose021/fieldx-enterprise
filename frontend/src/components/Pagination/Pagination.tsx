// components/Pagination/Pagination.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords?: number;
  itemsPerPage?: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  itemsPerPage
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;
  
  // Calculate the current visible range of items
  const startItem = Math.min((currentPage - 1) * (itemsPerPage || 10) + 1, totalRecords || 0);
  const endItem = Math.min(currentPage * (itemsPerPage || 10), totalRecords || 0);
  
  // Function to create an array of page numbers to display
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    
    // Always include first page
    pages.push(1);
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push('ellipsis');
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 2 && currentPage === 3) {
        pages.push(i);
      } else if (i === totalPages - 1 && currentPage === totalPages - 2) {
        pages.push(i);
      } else if (i >= currentPage - 1 && i <= currentPage + 1) {
        pages.push(i);
      }
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }
    
    // Always include last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const pageNumbers = getPageNumbers();
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      {/* Information on current items shown */}
      {totalRecords !== undefined && (
        <div className="text-sm text-gray-600">
          Εμφάνιση <span className="font-medium">{startItem}</span> έως{' '}
          <span className="font-medium">{endItem}</span> από{' '}
          <span className="font-medium">{totalRecords}</span> αποτελέσματα
        </div>
      )}
      
      {/* Pagination controls */}
      <div className="flex items-center">
        {/* Previous button */}
        <button
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 mr-1 rounded-md ${
            currentPage === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {/* Page numbers */}
        <div className="flex">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={`page-${index}`}>
              {page === 'ellipsis' ? (
                <span className="px-2 py-1 mx-1 text-gray-500 flex items-center">
                  <MoreHorizontal className="h-5 w-5" />
                </span>
              ) : (
                <button
                  onClick={() => page !== currentPage && onPageChange(page as number)}
                  className={`min-w-[36px] h-9 flex items-center justify-center mx-1 rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-label={`Page ${page}`}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Next button */}
        <button
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 ml-1 rounded-md ${
            currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;