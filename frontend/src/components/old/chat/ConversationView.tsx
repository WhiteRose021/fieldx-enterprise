'use client';

import React, { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { EspoCRMUser, ChatMessage, MessageStatus } from '@/services/chat/types/chat';

interface ConversationViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeUser: EspoCRMUser;
  selectedUser: EspoCRMUser;
  className?: string; // Add className prop
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  isLoading,
  activeUser,
  selectedUser,
  className = ''
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Determine if a message is from current user
  const isMessageFromCurrentUser = (message: ChatMessage): boolean => {
    return message.senderId === activeUser.id || 
           message.createdById === activeUser.id;
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
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
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3 sm:mb-4">
            <MessageIcon size={20} className="sm:w-6 sm:h-6" />
          </div>
          <h3 className="font-medium text-base sm:text-lg mb-1">No messages yet</h3>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
            Start a conversation with {selectedUser.name}
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
              
              {group.messages.map((message, messageIndex) => (
                <div
                  key={message.id || `${message.timestamp}-${messageIndex}`}
                  className={`flex mb-1.5 sm:mb-2 ${isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] ${isMessageFromCurrentUser(message) ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg p-2 sm:p-3 text-xs sm:text-sm ${
                        isMessageFromCurrentUser(message)
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.message}</p>
                    </div>
                    <div className={`flex items-center text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 ${
                      isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'
                    }`}>
                      <span>{formatTime(message)}</span>
                      {isMessageFromCurrentUser(message) && (
                        <span className="ml-1">
                          {getStatusIcon(message.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

// Message Icon component for empty state
const MessageIcon = ({ size = 24, className = '' }) => (
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
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);