'use client';

import React, { useRef, useEffect, ReactNode } from 'react';

interface ClickOutsideProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}

const ClickOutside: React.FC<ClickOutsideProps> = ({ 
  children, 
  onClick, 
  className = '' 
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        onClick();
      }
    };

    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Unbind the event listener on cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClick]);

  return (
    <div ref={wrapperRef} className={className}>
      {children}
    </div>
  );
};

export default ClickOutside;