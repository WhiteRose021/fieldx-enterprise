import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbProps {
  pageName: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ pageName }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 text-sm">
        <Link 
          href="/" 
          className="text-gray-500 hover:text-blue-600 transition-colors"
        >
          Αρχική
        </Link>
        
        <ChevronRight className="h-4 w-4 text-gray-400" />
        
        <span className="font-medium text-gray-900">{pageName}</span>
      </div>
    </div>
  );
};

export default Breadcrumb;