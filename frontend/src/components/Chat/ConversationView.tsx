import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { apiClient } from '@/lib/api-client';
import useSocket from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

interface ConversationViewProps {
  conversation: any;
  currentUserId?: string;
  onUpdateConversation: (conversation: any) => void;
}

// Make sure to add the default export
const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  currentUserId,
  onUpdateConversation
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const socket = useSocket();
  
  // Fetch messages when conversation changes
  useEffect(() => {
    if (conversation?.id) {
      fetchMessages();
    }
  }, [conversation?.id]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Listen for new messages from socket
  useEffect(() => {
    if (!socket || !conversation) return;
    
    socket.on('message:new', handleNewMessage);
    
    return () => {
      socket.off('message:new');
    };
  }, [socket, conversation]);
  
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ messages: any[] }>(`/chat/conversations/${conversation.id}/messages`);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewMessage = (data: any) => {
    // Only add messages for current conversation
    if (data.message.conversationId !== conversation.id) return;
    
    // Don't add duplicates
    if (messages.some(m => m.id === data.message.id)) return;
    
    setMessages(prev => [...prev, data.message]);
  };
  
  const sendMessage = async () => {
    if (!messageInput.trim() || !conversation?.id) return;
    
    try {
      setSending(true);
      
      const response = await apiClient.post(`/chat/conversations/${conversation.id}/messages`, {
        content: messageInput,
        contentType: 'text'
      });
      
      // Add to messages - socket will handle real-time updates too
      setMessages(prev => [...prev, response]);
      setMessageInput('');
      
      // Also update the conversation with latest message
      onUpdateConversation({
        ...conversation,
        lastMessage: {
          content: messageInput,
          contentType: 'text',
          createdAt: new Date().toISOString(),
          senderId: currentUserId
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Get conversation name
  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    
    // For 1:1 chats, use the other person's name
    if (!conversation.isGroup && currentUserId) {
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.userId !== currentUserId
      );
      return otherParticipant?.user.name || 'Conversation';
    }
    
    return 'Conversation';
  };
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Conversation header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold">{getConversationName()}</h2>
        <p className="text-sm text-gray-500">
          {conversation.isGroup 
            ? `${conversation.participants?.length || 0} participants` 
            : ''}
        </p>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center p-4 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  <p>{message.content}</p>
                  <div className="text-xs mt-1 text-right">
                    {format(new Date(message.createdAt), 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex">
          <textarea
            className="flex-1 border border-gray-300 rounded-l-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={1}
          />
          <button
            className="bg-blue-500 text-white px-4 rounded-r-md disabled:bg-blue-300"
            onClick={sendMessage}
            disabled={!messageInput.trim() || sending}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationView;