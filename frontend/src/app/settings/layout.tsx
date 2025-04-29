"use client";

import React from "react";
import { SettingsProvider } from "@/contexts/SettingsContext";
import SettingsNav from "./components/SettingsNav";
import AuthenticatedLayout from "@/components/layouts/AuthenticatedLayout";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      <SettingsProvider>
        <div className="bg-gray-50 min-h-screen">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-64 flex-shrink-0">
              <SettingsNav />
            </div>
            <div className="flex-grow">
              <div className="bg-white shadow rounded-lg">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
      </SettingsProvider>
    </AuthenticatedLayout>
  );
}