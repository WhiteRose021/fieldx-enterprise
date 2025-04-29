// CalendarHeader.tsx
"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar, MapPin } from "lucide-react";
import { CalendarView } from "./types";
import { subMonths, addMonths, format, getMonth, getYear } from "date-fns";

// Constants for month names
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface CalendarHeaderProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  onShowMap: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  setCurrentDate,
  view,
  setView,
  onShowMap
}) => {
  // Navigate to previous month
  const goToPrevious = () => {
    if (view === CalendarView.Month) {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      // Go to previous day
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  // Navigate to next month
  const goToNext = () => {
    if (view === CalendarView.Month) {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      // Go to next day
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  // Render title based on current view
  const renderTitle = () => {
    if (view === CalendarView.Month) {
      return `${MONTHS[getMonth(currentDate)]} ${getYear(currentDate)}`;
    } else if (view === CalendarView.Day) {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else {
      return `Week of ${format(currentDate, 'MMMM d, yyyy')}`;
    }
  };

  return (
    <>
      <header className="bg-white border-b shadow-sm py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Event Schedule</h1>
        
        {/* View buttons and Map button */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1 rounded-lg flex items-center ${view === CalendarView.Day ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setView(CalendarView.Day)}
            >
              <Calendar size={16} className="mr-1" />
              Day
            </button>
            <button 
              className={`px-3 py-1 rounded-lg flex items-center ${view === CalendarView.Month ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setView(CalendarView.Month)}
            >
              <Calendar size={16} className="mr-1" />
              Month
            </button>
          </div>
          
          <button
            onClick={onShowMap}
            className="px-3 py-1 rounded-lg flex items-center bg-green-500 text-white hover:bg-green-600"
          >
            <MapPin size={16} className="mr-1" />
            Map View
          </button>
        </div>
      </header>
      
      {/* Month title and navigation */}
      <div className="px-6 py-4 bg-white border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">{renderTitle()}</h2>
          
          <div className="flex">
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 mr-2"
              onClick={goToPrevious}
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100"
              onClick={goToNext}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};