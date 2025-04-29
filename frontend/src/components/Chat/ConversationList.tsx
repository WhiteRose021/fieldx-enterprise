// src/components/Chat/ConversationList.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { format, isToday, isYesterday } from 'date-fns';
import { Dialog } from '@headlessui/react';
// Updated import for Heroicons v2
import { PlusIcon, MagnifyingGlassIcon as SearchIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import UserAvatar from '@/components/UserAvatar';

interface ConversationListProps {
  conversations: any[];
  selectedConversationId: string | undefined;
  onSelectConversation: (conversation: any) => void;
  onCreateConversation: (data: any) => Promise<any>;
  loading: boolean;
  currentUserId: string | undefined;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  loading,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatUsers, setNewChatUsers] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Filter conversations by search query
  const filteredConversations = searchQuery
    ? conversations.filter(conv => {
        // Search in conversation name
        if (conv.name && conv.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return true;
        }
        // Search in participants
        return conv.participants.some((p: any) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.userName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : conversations;

  // Format timestamp for conversations
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MM/dd/yyyy');
    }
  };

  // Search for users to start a new chat
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Add a user to new chat
  const addUserToNewChat = (user: any) => {
    if (!newChatUsers.some(u => u.id === user.id)) {
      setNewChatUsers([...newChatUsers, user]);
    }
  };

  // Remove a user from new chat
  const removeUserFromNewChat = (userId: string) => {
    setNewChatUsers(newChatUsers.filter(u => u.id !== userId));
  };

  // Create new conversation
  const createNewConversation = async () => {
    if (newChatUsers.length === 0) return;

    try {
      const participantIds = newChatUsers.map(u => u.id);
      const isGroup = participantIds.length > 1;
      
      const data = {
        participantIds,
        isGroup,
        name: isGroup ? `Group (${newChatUsers.map(u => u.name.split(' ')[0]).join(', ')})` : undefined
      };
      
      const newConversation = await onCreateConversation(data);
      onSelectConversation(newConversation);
      setIsNewChatOpen(false);
      setNewChatUsers([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Get conversation display name
  const getConversationName = (conversation: any) => {
    if (conversation.name) return conversation.name;
    
    // For 1:1 chats, use the other person's name
    if (!conversation.isGroup && currentUserId) {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.id !== currentUserId
      );
      return otherParticipant?.name || 'Unknown';
    }
    
    return 'Unnamed Chat';
  };

  // Get avatar for conversation
  const getConversationAvatar = (conversation: any) => {
    if (!conversation.isGroup && currentUserId) {
      const otherParticipant = conversation.participants.find(
        (p: any) => p.id !== currentUserId
      );
      return otherParticipant;
    }
    return null;
  };

  // Get online status indicator
  const getStatusIndicator = (participant: any) => {
    if (!participant?.presence) return null;
    
    const status = participant.presence.status || 'offline';
    const colors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500'
    };
    
    return (
      <span 
        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white ${colors[status as keyof typeof colors]}`}
      />
    );
  };

  return (
    <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white">
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-xl text-gray-900">Messages</h2>
            <Button
              onClick={() => setIsNewChatOpen(true)}
              className="rounded-full h-8 w-8 p-0"
            >
              <PlusIcon className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-4 text-gray-500">
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => {
                const isSelected = conversation.id === selectedConversationId;
                const conversationName = getConversationName(conversation);
                const otherParticipant = getConversationAvatar(conversation);
                
                return (
                  <li 
                    key={conversation.id}
                    onClick={() => onSelectConversation(conversation)}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        {conversation.isGroup ? (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="font-medium text-gray-800">
                              {conversationName.charAt(0)}
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <UserAvatar 
                              user={otherParticipant} 
                              size="md" 
                            />
                            {getStatusIndicator(otherParticipant)}
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversationName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conversation.lastMessage ? 
                              formatTimestamp(conversation.lastMessage.createdAt) : ''}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessage ? (
                              conversation.lastMessage.contentType === 'text' ? (
                                conversation.lastMessage.content
                              ) : (
                                <span className="italic">
                                  {conversation.lastMessage.contentType === 'image' ? 'Photo' : 
                                   conversation.lastMessage.contentType === 'file' ? 'File' :
                                   conversation.lastMessage.contentType === 'system' ? 'System message' : 
                                   'Attachment'}
                                </span>
                              )
                            ) : ''}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="flex items-center justify-center h-5 w-5 bg-blue-500 text-white text-xs font-semibold rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog
        open={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="min-h-screen px-4 text-center">
          <div className="fixed inset-0 bg-black opacity-30" />

          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>

          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <Dialog.Title
              as="h3"
              className="text-lg font-medium leading-6 text-gray-900"
            >
              New Conversation
            </Dialog.Title>

            <div className="mt-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add Participants
                </label>
                <div className="relative">
                  <input
                    type="text"
                    className="block w-full pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search users..."
                    onChange={(e) => searchUsers(e.target.value)}
                  />
                  {searching && (
                    <div className="absolute right-3 top-2">
                      <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected users */}
              {newChatUsers.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected ({newChatUsers.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {newChatUsers.map(user => (
                      <div 
                        key={user.id}
                        className="flex items-center bg-blue-100 px-2 py-1 rounded-full"
                      >
                        <span className="text-sm text-blue-800">{user.name}</span>
                        <button
                          onClick={() => removeUserFromNewChat(user.id)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <span className="sr-only">Remove</span>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mb-4 max-h-60 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Results
                  </h4>
                  <ul className="divide-y divide-gray-200">
                    {searchResults.map(user => (
                      <li 
                        key={user.id}
                        className="py-2 flex items-center hover:bg-gray-50 cursor-pointer"
                        onClick={() => addUserToNewChat(user)}
                      >
                        <UserAvatar user={user} size="sm" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email || user.userName}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={newChatUsers.length === 0}
                  onClick={createNewConversation}
                >
                  Start Conversation
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ConversationList;