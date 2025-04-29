"use client";

import React from "react";

interface SettingsHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function SettingsHeader({ 
  title, 
  description, 
  actions 
}: SettingsHeaderProps) {
  return (
    <div className="border-b border-gray-200 px-6 py-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 max-w-4xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="mt-4 md:mt-0">{actions}</div>}
      </div>
    </div>
  );
}