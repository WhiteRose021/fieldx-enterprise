"use client";

import React, { useEffect, useRef, ReactNode } from 'react';

interface ClickOutsideProps {
  children: ReactNode;
  onClick: () => void;
}

const ClickOutside: React.FC<ClickOutsideProps> = ({ children, onClick }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        requestAnimationFrame(() => {
          if (wrapperRef.current) {
            onClick();
          }
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClick]);

  return <div ref={wrapperRef}>{children}</div>;
};

export default ClickOutside;
