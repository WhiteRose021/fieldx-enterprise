"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

export default function SettingsCard({ 
  title, 
  description, 
  icon,
  href 
}: SettingsCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 group"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <div className="ml-4 flex-grow">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}