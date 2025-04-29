'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, MessageSquarePlus, Users } from 'lucide-react';
import { EspoCRMUser } from '@/services/chat/types/chat';
import { UserStatus } from '@/services/chat/UserStatusService';
import { ChatViewMode } from './PopupChat'; // Import the ChatViewMode type

interface UserListProps {
  users: EspoCRMUser[];
  userStatuses: Record<string, UserStatus>;
  isLoadingUsers: boolean;
  viewMode: ChatViewMode;
  searchTerm: string;
  unreadMessagesByUser: Record<string, number>;
  onSelectUser: (user: EspoCRMUser) => void;
  onStartNewConversation: () => void; // Make sure this is defined
  className?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  userStatuses,
  isLoadingUsers,
  viewMode,
  searchTerm,
  unreadMessagesByUser,
  onSelectUser,
  onStartNewConversation,
  className = ''
}) => {
  const [displayedUsers, setDisplayedUsers] = useState<EspoCRMUser[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const USERS_PER_PAGE = 15;
  
  // Reset pagination when users array changes
  useEffect(() => {
    setDisplayedUsers(users.slice(0, USERS_PER_PAGE));
    setPage(1);
    setHasMore(users.length > USERS_PER_PAGE);
  }, [users]);

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore) {
          loadMoreUsers();
        }
      },
      { threshold: 0.1 }
    );

    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }

    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [hasMore, page]);

  // Load more users
  const loadMoreUsers = () => {
    const nextPage = page + 1;
    const nextUsers = users.slice(0, nextPage * USERS_PER_PAGE);
    
    setDisplayedUsers(nextUsers);
    setPage(nextPage);
    setHasMore(nextUsers.length < users.length);
  };

  const showNoResults = !isLoadingUsers && users.length === 0 && searchTerm;
  const showEmptyState = !isLoadingUsers && users.length === 0 && !searchTerm;
  
  // Determine status color
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
      default:
        return 'bg-gray-400';
    }
  };
  


const getTimeString = (user: EspoCRMUser): string => {
  // Use lastMessageTimestamp if available, fall back to current time if not
  if (!user.lastMessageTimestamp) {
    return '';
  }
  
  // Create date and add 2 hours to adjust for server time
  const date = new Date(user.lastMessageTimestamp);
  date.setHours(date.getHours() + 2); // Add 2 hours to correct server time
  
  const now = new Date();
  
  // If today, just show time
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
    <div className={`flex-1 flex flex-col ${className}`}>
      {viewMode === 'recent' && (
        <div className="flex justify-between items-center p-2 sm:p-3 sticky top-0 bg-white z-10 border-b">
          <h3 className="font-medium text-xs sm:text-sm text-gray-500">Recent Chats</h3>
          <button
            onClick={onStartNewConversation}
            className="flex items-center text-xs sm:text-sm text-blue-600 hover:text-blue-800"
          >
            <MessageSquarePlus size={14} className="mr-1 sm:size-full" />
            New Chat
          </button>
        </div>
      )}
      
      {viewMode === 'allUsers' && !searchTerm && (
        <div className="p-2 sm:p-3 sticky top-0 bg-white z-10 border-b">
          <h3 className="font-medium text-xs sm:text-sm text-gray-500">All Users</h3>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto bg-gray-50" ref={containerRef}>
        {isLoadingUsers ? (
          <div className="flex flex-col items-center justify-center h-40">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-xs sm:text-sm text-gray-500">Loading users...</p>
          </div>
        ) : (
          <>
            {showNoResults && (
              <div className="flex flex-col items-center justify-center h-40 p-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
                <p className="text-xs sm:text-sm text-gray-500 text-center">No users found matching "{searchTerm}"</p>
              </div>
            )}
            
{showEmptyState && (
  <div className="flex flex-col items-center justify-center h-40 p-4">
    <MessageSquarePlus className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2" />
    <p className="text-xs sm:text-sm text-gray-500 text-center">
      {viewMode === 'recent' 
        ? "You don't have any recent conversations" 
        : "No users available to chat with"}
    </p>
    {viewMode === 'recent' && (
      <button
        onClick={onStartNewConversation} // Make sure this is correct
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs sm:text-sm flex items-center"
      >
        <MessageSquarePlus size={16} className="mr-2" />
        Start a new conversation
      </button>
    )}
  </div>
)}
            
            {displayedUsers.length > 0 && (
              <ul className="divide-y">
                {displayedUsers.map((user) => {
                  const status = userStatuses[user.id] || 'offline';
                  const unreadCount = unreadMessagesByUser[user.id] || 0;
                  
                  return (
                    <li key={user.id} className={`bg-white hover:bg-gray-50 ${unreadCount > 0 ? 'bg-blue-50' : ''}`}>
                      <button
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 flex items-center text-left"
                        onClick={() => onSelectUser(user)}
                      >
                        {/* User avatar with status indicator */}
                        <div className="relative">
                          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-xs sm:text-base mr-2 sm:mr-3">
                            {user.name.charAt(0)}
                          </div>
                          <div className={`absolute bottom-0 right-1 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white ${getStatusColor(status)}`}></div>
                        </div>
                        
                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-medium text-xs sm:text-sm truncate ${unreadCount > 0 ? 'text-blue-800' : 'text-gray-900'}`}>
                              {user.name}
                            </h4>
                            <span className="text-[10px] sm:text-xs text-gray-500">
                              {getTimeString(user)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                              {user.userName && `@${user.userName}`}
                              {!user.userName && (status === 'online' ? 'Online' : status === 'away' ? 'Away' : 'Offline')}
                            </p>
                            
                            {/* Unread message count badge */}
                            {unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 px-1 sm:px-1.5 rounded-full bg-blue-600 text-white text-[10px] sm:text-xs font-medium">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
                
                {/* Loading indicator at the bottom */}
                {hasMore && (
                  <div ref={loaderRef} className="py-4 flex justify-center">
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  </div>
                )}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};