'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

interface MessageInputProps {
  newMessage: string;
  isSending: boolean;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onAttachmentClick: () => void;
  onEmojiClick: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  isSending,
  onMessageChange,
  onSendMessage,
  onAttachmentClick,
  onEmojiClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Function to handle input focus
  const handleFocus = () => {
    setIsExpanded(true);
  };

  // Function to handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Only collapse if the related target is not inside the container
    // or if the message is empty
    if (
      !containerRef.current?.contains(e.relatedTarget as Node) &&
      newMessage.trim() === ''
    ) {
      setIsExpanded(false);
    }
  };

  // Function to handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
      // Collapse the input after sending
      setIsExpanded(false);
    }
  };

  // Handle clicks outside the input area to collapse it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) && 
        newMessage.trim() === ''
      ) {
        setIsExpanded(false);
      }
    };

    // Attach event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [newMessage]);

  // Collapse after sending a message
  const handleSendWithCollapse = () => {
    onSendMessage();
    // Collapse the input after sending
    setIsExpanded(false);
  };

  return (
    <div 
      ref={containerRef}
      className="px-4 py-3 border-t"
      onBlur={handleBlur}
    >
      <div className="flex items-center">
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 p-2 self-end"
          onClick={onAttachmentClick}
        >
          <Paperclip size={20} />
        </button>
        <div className="flex-1 relative mx-2">
          <textarea
            ref={inputRef}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            className={`w-full border py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
              isExpanded ? 'min-h-[100px]' : 'h-10'
            }`}
            style={{ 
              transition: 'height 0.2s ease',
              overflowY: isExpanded ? 'auto' : 'hidden' // Only show scrollbar when expanded and needed
            }}
          />
        </div>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-700 p-2 self-end"
          onClick={onEmojiClick}
        >
          <Smile size={20} />
        </button>
        <button
          type="button"
          disabled={isSending || newMessage.trim() === ''}
          className={`p-2 ml-1 self-end ${
            isSending || newMessage.trim() === ''
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          onClick={handleSendWithCollapse}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;