'use client';

import React, { useState } from 'react';
import { X, Search, Check, AlertCircle } from 'lucide-react';
import { EspoCRMUser } from '@/services/chat/types/chat';

interface CreateGroupModalProps {
  users: EspoCRMUser[];
  onSubmit: (name: string, memberIds: string[]) => void;
  onCancel: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  users,
  onSubmit,
  onCancel
}) => {
  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<EspoCRMUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Filter users based on search term
  const filteredUsers = searchTerm
    ? users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.userName && user.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : users;
  
  // Toggle user selection
  const toggleUserSelection = (user: EspoCRMUser) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!groupName.trim()) {
      setError('Please enter a group name');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one group member');
      return;
    }
    
    // Submit group creation
    onSubmit(
      groupName,
      selectedUsers.map(user => user.id)
    );
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg=aspro rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-medium">Create New Group</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Group name input */}
          <div className="p-4 border-b">
            <label htmlFor="group-name" className="block mb-2 text-sm font-medium text-gray-700">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          
          {/* Error message */}
          {error && (
            <div className="px-4 py-2 bg-red-50 text-red-700 text-sm flex items-center">
              <AlertCircle size={16} className="mr-1" />
              {error}
            </div>
          )}
          
          {/* Member selection */}
          <div className="p-4 border-b">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Add Members
            </label>
            
            {/* Search input */}
            <div className="relative mb-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="mb-3">
                <div className="text-sm text-gray-500 mb-2">Selected ({selectedUsers.length}):</div>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div 
                      key={user.id}
                      className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
                    >
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => toggleUserSelection(user)}
                        className="ml-1 text-blue-500 hover:text-blue-700"
                        aria-label={`Remove ${user.name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* User list */}
            <div className="max-h-40 overflow-y-auto border rounded-md">
              {filteredUsers.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                <ul className="divide-y">
                  {filteredUsers.map(user => {
                    const isSelected = selectedUsers.some(u => u.id === user.id);
                    
                    return (
                      <li key={user.id}>
                        <button
                          type="button"
                          className={`w-full px-3 py-2 flex items-center hover:bg-gray-50 text-left ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => toggleUserSelection(user)}
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-3">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">{user.name}</h4>
                            {user.userName && (
                              <p className="text-sm text-gray-500 truncate">@{user.userName}</p>
                            )}
                          </div>
                          {isSelected && (
                            <Check size={18} className="text-blue-600" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};