// MonthView.tsx
"use client";

import React, { useMemo } from "react";
import { Event } from "./types";
import { 
  getDaysInMonth, 
  chunk, 
  getEventStyle 
} from "./utils/dateUtils";
import { 
  isSameDay, 
  isSameMonth, 
  format
} from "date-fns";

interface MonthViewProps {
  currentDate: Date;
  events: Event[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  events,
  onDayClick,
  onEventClick
}) => {
  // Get days for the current month view
  const daysInMonth = useMemo(() => {
    return getDaysInMonth(currentDate);
  }, [currentDate]);
  
  // Group events by date
  const eventsByDate = useMemo(() => {
    return events.reduce<Record<string, Event[]>>((acc, event) => {
      const dateKey = format(event.start, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

  // Organize days into weeks
  const weeks = useMemo(() => {
    return chunk(daysInMonth, 7);
  }, [daysInMonth]);

  // Get the number of events for a specific date (for displaying event count)
  const getEventCountForDate = (date: Date): number => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return (eventsByDate[dateKey] || []).length;
  };

  // Render day events
  const renderDayEvents = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dateEvents = eventsByDate[dateKey] || [];
    const maxEventsToShow = 3;
    const eventsToShow = dateEvents.slice(0, maxEventsToShow);

    return (
      <div className="space-y-1 mt-1">
        {eventsToShow.map(event => (
          <div
            key={event.id}
            className={`text-xs truncate p-1 rounded-lg ${getEventStyle(event.status)}`}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
          >
            <div className="flex items-center">
              <span className="font-medium mr-1">{format(event.start, 'HH:mm')}</span>
              <span className="truncate">{event.name}</span>
            </div>
          </div>
        ))}
        {dateEvents.length > maxEventsToShow && (
          <div className="text-xs text-gray-500 pl-1">
            +{dateEvents.length - maxEventsToShow} more
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-7 bg-white border rounded-lg shadow-md overflow-hidden">
      {/* Day headers */}
      <div className="p-2 text-center font-medium border-b border-r text-gray-700">Mon</div>
      <div className="p-2 text-center font-medium border-b border-r text-gray-700">Tue</div>
      <div className="p-2 text-center font-medium border-b border-r text-gray-700">Wed</div>
      <div className="p-2 text-center font-medium border-b border-r text-gray-700">Thu</div>
      <div className="p-2 text-center font-medium border-b border-r text-gray-700">Fri</div>
      <div className="p-2 text-center font-medium border-b border-r text-gray-700">Sat</div>
      <div className="p-2 text-center font-medium border-b text-gray-700">Sun</div>
      
      {/* Calendar grid */}
      {weeks.map((week, weekIndex) => (
        <React.Fragment key={`week-${weekIndex}`}>
          {week.map((day, dayIndex) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const dayEventsCount = getEventCountForDate(day);
            const isLastColumn = dayIndex === 6;
            const isLastRow = weekIndex === weeks.length - 1;
            
            return (
              <div 
                key={`day-${dayIndex}`}
                className={`min-h-[120px] p-2 cursor-pointer ${!isLastRow ? 'border-b' : ''} ${!isLastColumn ? 'border-r' : ''} ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'
                } ${isToday ? 'border-blue-500 border-2' : ''}`}
                onClick={() => onDayClick(day)}
              >
                <div className="flex justify-between items-center">
                  <div className={`text-lg font-medium ${isToday ? 'text-blue-500' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  {dayEventsCount > 0 && (
                    <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs text-white">
                      {dayEventsCount}
                    </div>
                  )}
                </div>
                
                {isCurrentMonth && renderDayEvents(day)}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};