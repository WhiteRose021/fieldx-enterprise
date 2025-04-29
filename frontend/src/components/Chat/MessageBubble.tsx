import React from 'react';
import { format } from 'date-fns';
import { CheckIcon, CheckCircleIcon } from '@heroicons/react/solid';

interface MessageBubbleProps {
  message: any;
  isOwn: boolean;
  showSender: boolean;
  previousMessage: any | null;
  sender: any;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showSender,
  previousMessage,
  sender
}) => {
  // Check if this message is a continuation from the same sender
  const isContinuation = previousMessage && previousMessage.senderId === message.senderId;
  
  // Format timestamp
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  // Get delivery status icon
  const getStatusIcon = () => {
    if (message.status === 'read') {
      return <CheckCircleIcon className="h-3.5 w-3.5 text-blue-500" />;
    } else if (message.status === 'delivered') {
      return <CheckCircleIcon className="h-3.5 w-3.5 text-gray-400" />;
    } else {
      return <CheckIcon className="h-3.5 w-3.5 text-gray-400" />;
    }
  };
  
  // Handle system messages
  if (message.contentType === 'system') {
    return (
      <div className="flex justify-center">
        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full max-w-xs text-center">
          {message.content}
        </div>
      </div>
    );
  }
  
  // Handle content based on type
  const renderContent = () => {
    switch (message.contentType) {
      case 'image':
        return message.attachments && message.attachments.length > 0 ? (
          <div className="mb-1">
            <img
              src={message.attachments[0].url}
              alt={message.attachments[0].fileName}
              className="max-w-xs rounded-lg max-h-60 object-contain"
            />
          </div>
        ) : (
          <div className="text-gray-500 italic">[Image]</div>
        );
      
      case 'file':
        return message.attachments && message.attachments.length > 0 ? (
          <div className="flex items-center mb-1 bg-gray-50 p-2 rounded">
            <div className="h-8 w-8 rounded bg-gray-200 flex items-center justify-center">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-2 overflow-hidden">
              <a 
                href={message.attachments[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline truncate block"
              >
                {message.attachments[0].fileName}
              </a>
              <span className="text-xs text-gray-500">
                {(message.attachments[0].fileSize / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 italic">[File]</div>
        );
      
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  };
  
  // Bubble for reply
  const replyBubble = message.replyTo ? (
    <div className="border-l-2 border-gray-300 pl-2 mb-1 mt-1 text-sm opacity-75">
      <p className="font-medium">{message.replyTo.senderName}</p>
      <p className="truncate">{message.replyTo.content}</p>
    </div>
  ) : null;

  return (
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
        !isContinuation ? 'mt-4' : 'mt-1'
      }`}
    >
      <div className={`max-w-xs ${isOwn ? 'order-1' : 'order-2'}`}>
        {showSender && !isContinuation && (
          <div className="text-xs text-gray-500 ml-2 mb-1">
            {sender?.name}
          </div>
        )}
        
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwn
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {replyBubble}
          {renderContent()}
          
          <div className={`text-xs mt-1 flex justify-end ${
            isOwn ? 'text-blue-200' : 'text-gray-500'
          }`}>
            {formatTime(message.createdAt)}
            {isOwn && (
              <span className="ml-1">
                {getStatusIcon()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;