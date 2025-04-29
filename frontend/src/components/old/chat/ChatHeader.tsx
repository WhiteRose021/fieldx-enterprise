'use client';

import React from 'react';
import { ChevronLeft, X, MoreVertical, Users } from 'lucide-react';
import { EspoCRMUser, ChatGroup } from '@/services/chat/types/chat';
import { UserStatus } from '@/services/chat/UserStatusService';

interface ChatHeaderProps {
  viewMode: 'recent' | 'allUsers' | 'conversation' | 'groups' | 'groupChat';
  selectedUser: EspoCRMUser | null;
  selectedGroup: ChatGroup | null;
  userStatus?: UserStatus;
  onBack: () => void;
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  viewMode,
  selectedUser,
  selectedGroup,
  userStatus = 'offline',
  onBack,
  onClose
}) => {
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
  
  // Determine title text
  const getTitle = () => {
    if (viewMode === 'conversation' && selectedUser) {
      return selectedUser.name;
    } else if (viewMode === 'groupChat' && selectedGroup) {
      return selectedGroup.name;
    } else if (viewMode === 'groups') {
      return 'Group Chats';
    } else if (viewMode === 'allUsers') {
      return 'All Users';
    } else {
      return 'Recent Chats';
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 border-b bg-blue-600 text-white">
      <div className="flex items-center">
        {(viewMode === 'conversation' || viewMode === 'groupChat') ? (
          <button
            onClick={onBack}
            className="p-1 mr-2 rounded-full hover:bg-blue-700 transition"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
        ) : null}
        
        <div>
          {viewMode === 'conversation' && selectedUser ? (
            <div className="flex items-center">
              <div className="relative mr-2">
                <div className="w-8 h-8 bg-blue-300 rounded-full flex items-center justify-center text-blue-800 font-medium">
                  {selectedUser.name.charAt(0)}
                </div>
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-blue-600 ${getStatusColor(userStatus)}`}></div>
              </div>
              <div>
                <h3 className="font-medium">{selectedUser.name}</h3>
                <p className="text-xs text-blue-200">
                  {userStatus === 'online' ? 'Online' : 
                   userStatus === 'away' ? 'Away' : 'Offline'}
                  {selectedUser.userName && ` • @${selectedUser.userName}`}
                </p>
              </div>
            </div>
          ) : viewMode === 'groupChat' && selectedGroup ? (
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-300 rounded-full flex items-center justify-center text-purple-800 font-medium mr-2">
                <Users size={16} />
              </div>
              <div>
                <h3 className="font-medium">{selectedGroup.name}</h3>
                <p className="text-xs text-blue-200">
                  {selectedGroup.members ? `${selectedGroup.members.length} members` : 'Group chat'}
                </p>
              </div>
            </div>
          ) : (
            <h3 className="font-medium">
              {getTitle()}
            </h3>
          )}
        </div>
      </div>
      
      <div className="flex items-center">
        {(viewMode === 'conversation' || viewMode === 'groupChat') && (
          <button
            className="p-2 rounded-full hover:bg-blue-700 transition"
            aria-label="More options"
          >
            <MoreVertical size={18} />
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-blue-700 transition"
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};