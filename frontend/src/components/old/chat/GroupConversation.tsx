'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, FileIcon, Download } from 'lucide-react';
import { EspoCRMUser, ChatMessage, MessageStatus, ChatGroup, MessageType, FileAttachment } from '@/services/chat/types/chat';
import { UserStatus } from '@/services/chat/UserStatusService';
import FileUploadService from '@/services/chat/FileUploadService';

interface GroupConversationProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeUser: EspoCRMUser;
  selectedGroup: ChatGroup;
  userStatuses: Record<string, UserStatus>;
  className?: string; // Add className prop
}

export const GroupConversation: React.FC<GroupConversationProps> = ({
  messages,
  isLoading,
  activeUser,
  selectedGroup,
  userStatuses,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Determine if a message is from current user
  const isMessageFromCurrentUser = (message: ChatMessage): boolean => {
    return message.senderId === activeUser.id || 
           message.createdById === activeUser.id;
  };
  
// Format timestamp to readable time
const formatTime = (message: ChatMessage): string => {
  // Use timestamp if available (for optimistic messages), otherwise use createdAt
  const msgTime = message.timestamp 
    ? new Date(message.timestamp) 
    : new Date(message.createdAt || Date.now());
  
  // Add 2 hours to adjust for server time
  msgTime.setHours(msgTime.getHours() + 2);
      
  return msgTime.toLocaleTimeString('default', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

  // Group messages by date
  type MessageGroup = {
    date: string;
    messages: ChatMessage[];
  };
  
  const groupMessagesByDate = (messages: ChatMessage[]): MessageGroup[] => {
    const groups: { [key: string]: MessageGroup } = {};
    
    messages.forEach(message => {
      // Use timestamp if available (for optimistic messages), otherwise use createdAt
      const date = message.timestamp 
        ? new Date(message.timestamp) 
        : new Date(message.createdAt || Date.now());
      
      // Add 2 hours to adjust for server time
      date.setHours(date.getHours() + 2);
        
      const dateStr = date.toLocaleDateString('default', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          messages: []
        };
      }
      
      groups[dateStr].messages.push(message);
    });
    
    return Object.values(groups);
  };
  
  const messageGroups = groupMessagesByDate(messages);
  
  // Get status icon for message
  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case MessageStatus.DELIVERED:
        return <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 text-blue-500" />;
      case MessageStatus.FAILED:
        return <XCircle size={12} className="sm:w-3.5 sm:h-3.5 text-red-500" />;
      case MessageStatus.PENDING:
        return <Loader2 size={12} className="sm:w-3.5 sm:h-3.5 text-gray-400 animate-spin" />;
      default:
        return <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 text-gray-400" />;
    }
  };
  
  const renderAttachments = (attachments: FileAttachment[]) => {
    if (!attachments || attachments.length === 0) return null;
    
    return (
      <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-2">
        {attachments.map((attachment, index) => {
          const isImage = attachment.type?.startsWith('image/');
          
          if (isImage) {
            return (
              <div key={attachment.id || index} className="max-w-[150px] sm:max-w-[200px] rounded overflow-hidden">
                <img 
                  src={attachment.url} 
                  alt={attachment.name} 
                  className="max-w-full h-auto"
                />
              </div>
            );
          }
          
          return (
            <div key={attachment.id || index} className="flex items-center p-1 sm:p-2 bg-gray-100 rounded text-xs sm:text-sm">
              <FileIcon className="text-gray-500 mr-1 sm:mr-2" size={16} />
              <div className="flex-1 min-w-0">
                <p className="truncate">{attachment.name}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {(attachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <a 
                href={attachment.url} 
                download={attachment.name}
                className="ml-1 sm:ml-2 p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={14} className="sm:w-4 sm:h-4" />
              </a>
            </div>
          );
        })}
      </div>
    );
  };  
  
  return (
    <div className={`flex-1 overflow-y-auto p-2 sm:p-3 ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 animate-spin mb-2" />
            <p className="text-xs sm:text-sm text-gray-500">Loading conversation...</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-3 sm:mb-4">
            <Users size={20} className="sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-medium text-base sm:text-lg mb-1">No messages yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            Start a conversation in the {selectedGroup.name} group
          </p>
        </div>
      ) : (
        <>
          {messageGroups.map((group, groupIndex) => (
            <div key={group.date} className="mb-3 sm:mb-4">
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 rounded-full text-[10px] sm:text-xs text-gray-500">
                  {group.date}
                </div>
              </div>
              
              {group.messages.map((message, messageIndex) => {
                const isFromCurrentUser = isMessageFromCurrentUser(message);
                const showSender = !isFromCurrentUser && 
                                   messageIndex === 0 || 
                                   (messageIndex > 0 && 
                                    group.messages[messageIndex - 1].senderId !== message.senderId);
                
                return (
                  <div
                    key={message.id || `${message.timestamp}-${messageIndex}`}
                    className={`flex mb-1.5 sm:mb-2 ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] sm:max-w-[75%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                      {/* Sender name for group chats */}
                      {showSender && !isFromCurrentUser && (
                        <div className="ml-2 mb-0.5 sm:mb-1 text-[10px] sm:text-xs font-medium text-gray-500">
                          {message.senderName}
                        </div>
                      )}
                      
                      <div
                        className={`rounded-lg p-2 sm:p-3 text-xs sm:text-sm ${
                          isFromCurrentUser
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.message}</p>
                        
                        {/* Render attachment if present */}
                        {message.attachments && message.attachments.length > 0 && renderAttachments(message.attachments)}
                        </div>
                      
                      <div className={`flex items-center text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 ${
                        isFromCurrentUser ? 'justify-end' : 'justify-start'
                      }`}>
                        <span>{formatTime(message)}</span>
                        {isFromCurrentUser && (
                          <span className="ml-1">
                            {getStatusIcon(message.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

// Users icon component
const Users = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);