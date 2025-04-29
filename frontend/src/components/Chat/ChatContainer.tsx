// Fixed ChatContainer.tsx to prevent repeated API calls
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ConversationList from './ConversationList';
import ConversationView from './ConversationView';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import useSocket from '@/hooks/useSocket';
import { useToast } from '@/hooks/use-toast';

// Define conversation type
interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: Array<{
    id: string;
    userId: string;
    name?: string;
    lastReadMessageId?: string;
    lastReadAt?: string;
    presence?: {
      status: string;
    };
  }>;
  lastMessage?: {
    id: string;
    content: string;
    contentType: string;
    createdAt: string;
    senderId: string;
    senderName: string;
  };
  messages?: Array<any>;
  unreadCount?: number;
}

// Define component props
interface ChatContainerProps {
  initialConversation?: Conversation;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ initialConversation }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(initialConversation || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();
  
  // Use refs to prevent duplicate fetches and track fetch status
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Load conversations on mount
  useEffect(() => {
    // Set mounted ref to true when component mounts
    mountedRef.current = true;
    
    // Clean up function to prevent state updates after unmount
    return () => {
      mountedRef.current = false;
      // Clear any pending timeouts when component unmounts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const fetchConversationsDirectly = async () => {
    // Prevent concurrent fetches
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching conversations directly...");
      
      // Get token directly from storage
      const userSession = JSON.parse(sessionStorage.getItem('user_session') || '{}');
      const token = userSession.token || localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error("No authentication token available");
      }
      
      // Make direct fetch with explicit token
      const response = await fetch('/api/chat/conversations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status}`, errorText);
        throw new Error(`Failed to fetch conversations: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if component is still mounted before updating state
      if (!mountedRef.current) return;
      
      if (data && typeof data === 'object' && 'conversations' in data) {
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
        // Reset retry count on success
        retryCountRef.current = 0;
      } else {
        setConversations([]);
        console.error('Unexpected API response format:', data);
        setError('Received unexpected data format from server');
      }
    } catch (error) {
      // Check if component is still mounted before updating state
      if (!mountedRef.current) return;
      
      console.error('Error fetching conversations directly:', error);
      setError('Failed to load conversations. Please try again later.');
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
      
      // Limit retry attempts
      retryCountRef.current += 1;
      if (retryCountRef.current < 3) {
        console.log(`Retry attempt ${retryCountRef.current} scheduled in 5 seconds...`);
        // Schedule retry with increasing delay
        fetchTimeoutRef.current = setTimeout(() => {
          // Only retry if still mounted
          if (mountedRef.current) {
            isFetchingRef.current = false;
            fetchConversationsDirectly();
          }
        }, 5000 * retryCountRef.current); // Increase delay with each retry
      }
    } finally {
      // Check if component is still mounted before updating state
      if (mountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  };

  // Handle socket and fetch conversations
  useEffect(() => {
    // Don't try to fetch without a socket connection
    if (!socket) return;
    
    // Simplified fetch in ChatContainer
    const fetchConversations = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getConversations();
        if (response.conversations) {
          setConversations(response.conversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    // Initial fetch
    fetchConversations();
    
    // If we have an initialConversation and socket is available, join the conversation room
    if (initialConversation && socket) {
      socket.emit('join:conversation', { conversationId: initialConversation.id });
    }
    
    // Set up socket event listeners (only once)
    socket.on('message:new', handleNewMessage);
    socket.on('conversation:update', handleConversationUpdate);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      if (mountedRef.current) {
        setError(`Chat connection error: ${error}`);
        toast({
          title: 'Error',
          description: error as string,
          variant: 'destructive',
        });
      }
    });

    // Clean up event listeners
    return () => {
      socket.off('message:new');
      socket.off('conversation:update');
      socket.off('presence:update');
      socket.off('error');
    };
  }, [socket, toast]); // Only depend on socket and toast, not conversations

  // Handle selecting a conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Join the conversation room via socket
    if (socket && conversation) {
      socket.emit('join:conversation', { conversationId: conversation.id });
    }
  };

  // Handle new message socket event
  const handleNewMessage = (data: { message: any }) => {
    const { message } = data;
    
    // Update conversation list
    setConversations(prevConversations => {
      // Find the affected conversation
      const conversationIndex = prevConversations.findIndex(
        conv => conv.id === message.conversationId
      );
      
      if (conversationIndex === -1) {
        // If this is a new conversation, we'll handle it in a separate fetch
        return prevConversations;
      }
      
      // Clone the conversations array
      const updatedConversations = [...prevConversations];
      
      // Update the conversation with new message info
      const conversation = { ...updatedConversations[conversationIndex] };
      conversation.lastMessage = {
        id: message.id,
        content: message.content,
        contentType: message.contentType,
        createdAt: message.createdAt,
        senderId: message.senderId,
        senderName: message.senderName
      };
      
      // Update unread count if this isn't the selected conversation
      if (
        selectedConversation?.id !== conversation.id &&
        message.senderId !== user?.id
      ) {
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      
      // Move this conversation to the top
      updatedConversations.splice(conversationIndex, 1);
      updatedConversations.unshift(conversation);
      
      return updatedConversations;
    });
    
    // If this is the currently selected conversation, update it
    if (selectedConversation?.id === message.conversationId) {
      setSelectedConversation(prevConversation => {
        if (!prevConversation) return null;
        
        // If the message is already in the conversation, don't add it again
        if (
          prevConversation.messages &&
          prevConversation.messages.some((m) => m.id === message.id)
        ) {
          return prevConversation;
        }
        
        return {
          ...prevConversation,
          lastMessage: {
            id: message.id,
            content: message.content,
            contentType: message.contentType,
            createdAt: message.createdAt,
            senderId: message.senderId,
            senderName: message.senderName
          },
          // Add message to the conversation if messages are loaded
          messages: prevConversation.messages 
            ? [...prevConversation.messages, message]
            : undefined
        };
      });
    }
  };

  // Handle conversation update socket event
  const handleConversationUpdate = (data: { conversationId: string; userId: string; lastReadMessageId: string; lastReadAt: string }) => {
    const { conversationId, userId, lastReadMessageId, lastReadAt } = data;
    
    // Update conversation in the list
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        if (conv.id !== conversationId) return conv;
        
        // Update the participant's read status
        const updatedParticipants = conv.participants.map((p) => {
          if (p.userId !== userId) return p;
          
          return {
            ...p,
            lastReadMessageId,
            lastReadAt
          };
        });
        
        return {
          ...conv,
          participants: updatedParticipants
        };
      });
    });
    
    // Update selected conversation if this is the current one
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(prevConversation => {
        if (!prevConversation) return null;
        
        const updatedParticipants = prevConversation.participants.map((p) => {
          if (p.userId !== userId) return p;
          
          return {
            ...p,
            lastReadMessageId,
            lastReadAt
          };
        });
        
        return {
          ...prevConversation,
          participants: updatedParticipants
        };
      });
    }
  };

  // Handle presence update socket event
  const handlePresenceUpdate = (data: { userId: string; status: string }) => {
    const { userId, status } = data;
    
    // Update user presence in all conversations
    setConversations(prevConversations => {
      return prevConversations.map(conv => {
        const updatedParticipants = conv.participants.map((p) => {
          if (p.userId !== userId) return p;
          
          return {
            ...p,
            presence: {
              ...(p.presence || {}),
              status
            }
          };
        });
        
        return {
          ...conv,
          participants: updatedParticipants
        };
      });
    });
    
    // Update selected conversation if affected
    if (selectedConversation) {
      setSelectedConversation(prevConversation => {
        if (!prevConversation) return null;
        
        const updatedParticipants = prevConversation.participants.map((p) => {
          if (p.userId !== userId) return p;
          
          return {
            ...p,
            presence: {
              ...(p.presence || {}),
              status
            }
          };
        });
        
        return {
          ...prevConversation,
          participants: updatedParticipants
        };
      });
    }
  };

  // Create a new conversation
  const handleCreateConversation = async (data: { participantIds: string[]; isGroup: boolean; name?: string }) => {
    try {
      const response = await apiClient.createConversation(data);
      
      // Add to conversations list
      setConversations(prev => [response, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(response);
      
      return response;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Retry connection
  const handleRetryConnection = () => {
    setError(null);
    retryCountRef.current = 0;
    isFetchingRef.current = false;
    
    // Attempt to reconnect the socket first
    if (socket) {
      socket.connect();
    }
    
    // Schedule a fetch after a short delay to allow socket to reconnect
    fetchTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        // Clear previous fetch status to prevent multiple fetches
        isFetchingRef.current = false;
        
        // Now the useEffect with socket dependency will run again
        // and attempt to fetch conversations
      }
    }, 1000);
  };

  // Show error state if there's a problem
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg shadow-sm max-w-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Connection Error</h3>
          <p className="mb-4">{error}</p>
          <button
            onClick={handleRetryConnection}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      <ConversationList 
        conversations={conversations} 
        selectedConversationId={selectedConversation?.id}
        onSelectConversation={handleSelectConversation}
        onCreateConversation={handleCreateConversation}
        loading={loading}
        currentUserId={user?.id}
      />
      
      {selectedConversation ? (
        <ConversationView 
          conversation={selectedConversation}
          currentUserId={user?.id}
          onUpdateConversation={(updatedConversation: Conversation) => {
            setSelectedConversation(updatedConversation);
            // Also update in the conversations list
            setConversations(prev => 
              prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
            );
          }}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">No conversation selected</h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a conversation from the list or create a new one.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatContainer;