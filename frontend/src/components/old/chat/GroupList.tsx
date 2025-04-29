'use client';

import React from 'react';
import { Loader2, Users, UsersRound } from 'lucide-react';
import { ChatGroup } from '@/services/chat/types/chat';

interface GroupListProps {
  groups: ChatGroup[];
  isLoading: boolean;
  searchTerm: string;
  unreadMessagesByGroup: Record<string, number>; // Add unread messages for groups
  onSelectGroup: (group: ChatGroup) => void;
}

export const GroupList: React.FC<GroupListProps> = ({
  groups,
  isLoading,
  searchTerm,
  unreadMessagesByGroup,
  onSelectGroup
}) => {
  const showNoResults = !isLoading && groups.length === 0 && searchTerm;
  const showEmptyState = !isLoading && groups.length === 0 && !searchTerm;
  
  // Get formatted timestamp from date
  const getTimeString = (date: Date): string => {
    // If today, just show time
    const now = new Date();
    if (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    ) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-3 sticky top-0 bg-aspro z-10 border-b">
        <h3 className="font-medium text-sm text-gray-500">Group Chats</h3>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-sm text-gray-500">Loading groups...</p>
        </div>
      ) : (
        <>
          {showNoResults && (
            <div className="flex flex-col items-center justify-center h-40 p-4">
              <Users className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 text-center">No groups found matching "{searchTerm}"</p>
            </div>
          )}
          
          {showEmptyState && (
            <div className="flex flex-col items-center justify-center h-40 p-4">
              <UsersRound className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 text-center">
                You don't have any group chats
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Create a new group using the + button above
              </p>
            </div>
          )}
          
          {groups.length > 0 && (
            <ul className="divide-y">
              {groups.map((group) => {
                const unreadCount = unreadMessagesByGroup[group.id] || 0;
                
                return (
                  <li key={group.id} className={`bg-aspro hover:bg-gray-50 ${unreadCount > 0 ? 'bg-blue-50' : ''}`}>
                    <button
                      className="w-full px-4 py-3 flex items-center text-left"
                      onClick={() => onSelectGroup(group)}
                    >
                      {/* Group avatar */}
                      <div className="relative">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium mr-3">
                          <Users size={16} />
                        </div>
                      </div>

                      
                      {/* Group info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className={`font-medium truncate ${unreadCount > 0 ? 'text-blue-800' : 'text-gray-900'}`}>
                            {group.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {/* Use current date as placeholder */}
                            {getTimeString(new Date(group.createdAt || Date.now()))}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500 truncate">
                            {group.members ? `${group.members.length} members` : 'Group chat'}
                          </p>
                          
                          {/* Unread message count badge */}
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
};