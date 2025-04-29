"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { useTimeline } from '@/hooks/useTimeline';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { TimelineEvent } from '@/lib/api/timeline';

const TimelinePage = () => {
  const { toast } = useToast();
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  
  const {
    events,
    isLoading,
    error,
    dateRange,
    selectedUsers,
    availableUsers,
    selectedEntityTypes,
    availableEntityTypes,
    setDateRange,
    toggleUser,
    toggleEntityType,
    selectAllEntityTypes,
    clearEntityTypeSelection,
    saveEntityTypeSelection,
    refreshEvents
  } = useTimeline();

  // Handle error with useEffect instead of during render
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Navigation functions
  const goToToday = () => {
    const today = new Date();
    
    if (view === 'day') {
      setDateRange(startOfWeek(today), endOfWeek(today));
    } else if (view === 'week') {
      setDateRange(startOfWeek(today), endOfWeek(today));
    } else {
      // Month view
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setDateRange(start, end);
    }
  };

  const goToPrevious = () => {
    if (view === 'day') {
      setDateRange(subDays(dateRange.start, 1), subDays(dateRange.end, 1));
    } else if (view === 'week') {
      setDateRange(subDays(dateRange.start, 7), subDays(dateRange.end, 7));
    } else {
      // Month view
      const start = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() - 1, 1);
      const end = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), 0);
      setDateRange(start, end);
    }
  };

  const goToNext = () => {
    if (view === 'day') {
      setDateRange(addDays(dateRange.start, 1), addDays(dateRange.end, 1));
    } else if (view === 'week') {
      setDateRange(addDays(dateRange.start, 7), addDays(dateRange.end, 7));
    } else {
      // Month view
      const start = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() + 1, 1);
      const end = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth() + 2, 0);
      setDateRange(start, end);
    }
  };

  // Save settings when changing filters
  const handleSaveFilters = async () => {
    try {
      await saveEntityTypeSelection();
      toast({
        title: "Settings Saved",
        description: "Your timeline preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save timeline preferences.",
        variant: "destructive",
      });
    }
  };

  // Generate date range for the view
  const dates = useMemo(() => {
    const dateArray: Date[] = [];
    let currentDate = new Date(dateRange.start);
    
    while (currentDate <= dateRange.end) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dateArray;
  }, [dateRange]);

  return (
    <AuthenticatedLayout>
      <div className="mx-auto px-4 py-6">
        <Breadcrumb pageName="Timeline" />

        <div className="grid gap-6">
          {/* Controls */}
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={goToPrevious}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  Previous
                </button>
                <button 
                  onClick={goToToday}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                >
                  Today
                </button>
                <button 
                  onClick={goToNext}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100"
                >
                  Next
                </button>
                
                <span className="text-lg font-medium">
                  {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
                </span>
              </div>
              
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </Card>
          
          {/* Filters */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Entity Types Filter */}
            <Card className="p-4">
              <h3 className="mb-2 text-lg font-medium">Entity Types</h3>
              <div className="mb-2 flex gap-2">
                <button 
                  onClick={selectAllEntityTypes}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                >
                  Select All
                </button>
                <button 
                  onClick={clearEntityTypeSelection}
                  className="rounded-lg border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100"
                >
                  Clear
                </button>
                <button 
                  onClick={handleSaveFilters}
                  className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {availableEntityTypes.length > 0 ? (
                  availableEntityTypes.map(entityType => (
                    <div key={entityType} className="mb-1 flex items-center">
                      <input
                        type="checkbox"
                        id={`entity-${entityType}`}
                        checked={selectedEntityTypes.includes(entityType)}
                        onChange={() => toggleEntityType(entityType)}
                        className="mr-2 h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`entity-${entityType}`} className="text-sm">
                        {entityType}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No entity types available</div>
                )}
              </div>
            </Card>
            
            {/* Users Filter */}
            <Card className="p-4">
              <h3 className="mb-2 text-lg font-medium">Technicians</h3>
              <div className="max-h-60 overflow-y-auto">
                {availableUsers.length > 0 ? (
                  availableUsers.map(user => (
                    <div key={user.id} className="mb-1 flex items-center">
                      <input
                        type="checkbox"
                        id={`user-${user.id}`}
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUser(user.id)}
                        className="mr-2 h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`user-${user.id}`} className="text-sm">
                        {user.name}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No technicians available</div>
                )}
              </div>
            </Card>
            
            {/* Timeline View */}
            <div className="lg:col-span-3">
              <Card className="h-full p-4">
                {isLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="flex h-64 items-center justify-center">
                    <p className="text-gray-500">No events to display for the selected filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <WeekView 
                      events={events} 
                      dates={dates}
                      users={availableUsers
                        .filter(u => selectedUsers.length === 0 || selectedUsers.includes(u.id))
                        .map(u => ({ id: u.id, name: u.name }))}
                    />
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
};

// Simple Week View component
interface WeekViewProps {
  events: TimelineEvent[];
  dates: Date[];
  users: { id: string, name: string }[];
}

const WeekView: React.FC<WeekViewProps> = ({ events, dates, users }) => {
  // Group events by date and userId
  const eventsByDateAndUser = useMemo(() => {
    const grouped: Record<string, Record<string, TimelineEvent[]>> = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.dateStart);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      const userId = event.userId || 'unassigned';
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = {};
      }
      
      if (!grouped[dateKey][userId]) {
        grouped[dateKey][userId] = [];
      }
      
      grouped[dateKey][userId].push(event);
    });
    
    return grouped;
  }, [events]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              User
            </th>
            {dates.map(date => (
              <th 
                key={date.toISOString()} 
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {format(date, 'EEE, MMM d')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.length === 0 ? (
            <tr>
              <td colSpan={dates.length + 1} className="px-6 py-4 text-center text-sm text-gray-500">
                No users selected
              </td>
            </tr>
          ) : (
            users.map(user => (
              <tr key={user.id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                {dates.map(date => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const userEvents = eventsByDateAndUser[dateKey]?.[user.id] || [];
                  
                  return (
                    <td key={date.toISOString()} className="px-6 py-4 text-sm text-gray-500">
                      {userEvents.length > 0 ? (
                        <div className="space-y-2">
                          {userEvents.map(event => (
                            <div 
                              key={event.id} 
                              className="rounded-lg p-2"
                              style={{ backgroundColor: event.color || '#EBF5FF' }}
                            >
                              <div className="font-medium">{event.name}</div>
                              <div className="text-xs">
                                {format(new Date(event.dateStart), 'h:mm a')}
                                {event.dateEnd && ` - ${format(new Date(event.dateEnd), 'h:mm a')}`}
                              </div>
                              <div className="text-xs">{event.entityType}</div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TimelinePage;