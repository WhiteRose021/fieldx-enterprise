'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Search, WifiOff, RefreshCw, Loader2, User, Users, Plus, PaperclipIcon, Smile } from 'lucide-react';
import ChatService, { getActiveUser } from '@/services/chat/ChatService';
import GroupChatService from '@/services/chat/GroupChatService';
import UserStatusService, { UserStatus } from '@/services/chat/UserStatusService';
import FileUploadService from '@/services/chat/FileUploadService';
import { formatDateForEspoCRM } from '@/services/chat/DateUtils';
import { EspoCRMUser, ChatMessage, MessageStatus, ChatType, ChatGroup, FileAttachment, MessageType } from '@/services/chat/types/chat';
import { ChatHeader } from './ChatHeader';
import { UserList } from './UserList';
import { ConversationView } from './ConversationView';
import { MessageInput } from './MessageInput';
import { GroupList } from './GroupList';
import { GroupConversation } from './GroupConversation';
import { CreateGroupModal } from './CreateGroupModal';
import EmojiPicker from './EmojiPicker';

// Define the type for view modes to avoid errors
export type ChatViewMode = 'recent' | 'allUsers' | 'conversation' | 'groups' | 'groupChat';

export interface PopupChatProps {
  currentUser?: EspoCRMUser;
  onClose?: () => void;
}

export interface ChatState {
  users: EspoCRMUser[];
  userStatuses: Record<string, UserStatus>;
  allUsers: EspoCRMUser[];
  recentConversations: EspoCRMUser[];
  groups: ChatGroup[];
  selectedUser: EspoCRMUser | null;
  selectedGroup: ChatGroup | null;
  conversationMessages: ChatMessage[];
  newMessage: string;
  searchTerm: string;
  isLoading: boolean;
  isSending: boolean;
  isLoadingUsers: boolean;
  viewMode: ChatViewMode;
  connectionStatus: 'online' | 'offline' | 'reconnecting';
  isRefreshing: boolean;
  error: string | null;
  errorType?: string;
  isEmojiPickerOpen: boolean;
  isCreateGroupModalOpen: boolean;
  isAttachmentUploading: boolean;
  // Change to arrays instead of single items
  selectedFiles: File[];
  selectedAttachments: FileAttachment[];
  // Track new messages for notifications
  unreadMessagesByUser: Record<string, number>;
}

const PopupChat: React.FC<PopupChatProps> = ({ currentUser, onClose }) => {
  const [state, setState] = useState<ChatState>({
    users: [],
    userStatuses: {},
    allUsers: [],
    recentConversations: [],
    groups: [],
    selectedUser: null,
    selectedGroup: null,
    conversationMessages: [],
    newMessage: '',
    searchTerm: '',
    isLoading: false,
    isSending: false,
    isLoadingUsers: false,
    viewMode: 'recent',
    connectionStatus: 'online',
    isRefreshing: false,
    error: null,
    isEmojiPickerOpen: false,
    isCreateGroupModalOpen: false,
    isAttachmentUploading: false,
    // Initialize as arrays
    selectedFiles: [],
    selectedAttachments: [],
    // Initialize unread messages tracker
    unreadMessagesByUser: {}
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get the active user (either from props or localStorage)
  const activeUser = currentUser || getActiveUser();
  
  // Initialize services
  useEffect(() => {
    if (!activeUser) return;
    
    // Initialize chat service
    ChatService.initialize(activeUser.id);
    
    // Initialize user status service
    UserStatusService.initialize();
    
    // Update current user's status
    UserStatusService.updateUserStatus(activeUser.id, 'online');
    
    // Register callbacks for new messages and connection status changes
    ChatService
      .onNewMessage(handleNewMessage)
      .onConnectionStatusChange((status) => {
        setState(prev => ({ 
          ...prev, 
          connectionStatus: status,
          error: status === 'offline' ? 'Connection lost. Trying to reconnect...' : null
        }));
      });
    
    // Start polling for new messages
    ChatService.startPolling();
    
    // Fetch any pending messages for ALL conversations
    fetchAllPendingMessages();
    
    // Set up interval to update user activity
    const activityInterval = setInterval(() => {
      UserStatusService.updateUserActivity(activeUser.id);
    }, 60000); // Every minute
    
    // Cleanup when component unmounts
    return () => {
      ChatService.stopPolling();
      UserStatusService.shutdown();
      clearInterval(activityInterval);
    };
  }, [activeUser]);

  // Fetch all pending messages when component mounts
  const fetchAllPendingMessages = async () => {
    if (!activeUser) return;
    
    try {
      // Get all pending messages for this user
      const pendingMessages = await ChatService.getUnreadMessages(activeUser.id);
      
      // Group messages by sender
      const messagesBySender: Record<string, ChatMessage[]> = {};
      const newUnreadCounts: Record<string, number> = {};
      
      pendingMessages.forEach(message => {
        const senderId = message.senderId || '';
        if (!messagesBySender[senderId]) {
          messagesBySender[senderId] = [];
          newUnreadCounts[senderId] = 0;
        }
        messagesBySender[senderId].push(message);
        newUnreadCounts[senderId]++;
      });
      
      // Update unread message counts
      setState(prev => ({
        ...prev,
        unreadMessagesByUser: {...prev.unreadMessagesByUser, ...newUnreadCounts}
      }));
      
      // Update the state to reflect new messages
      setState(prev => {
        // If a conversation is already open, update it
        if (prev.selectedUser && messagesBySender[prev.selectedUser.id]) {
          return {
            ...prev,
            conversationMessages: [
              ...prev.conversationMessages,
              ...messagesBySender[prev.selectedUser.id]
            ]
          };
        }
        return prev;
      });
      
      // Update recent conversations based on new messages
      Object.keys(messagesBySender).forEach(senderId => {
        updateRecentConversation(senderId);
      });
    } catch (error) {
      console.error('Failed to fetch pending messages:', error);
    }
  };

  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatWindowClick = (event: MouseEvent) => {
      const messageInputArea = document.querySelector('.message-input-container');
      if (messageInputArea && messageInputArea.contains(event.target as Node)) {
        return;
      }
      
      if (state.newMessage.trim() === '') {
        setState(prev => ({ ...prev, newMessage: '' }));
      }
    };

    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      chatWindow.addEventListener('click', handleChatWindowClick);
    }

    return () => {
      if (chatWindow) {
        chatWindow.removeEventListener('click', handleChatWindowClick);
      }
    };
  }, [state.newMessage]);
  
  // Handle new incoming messages with improved background handling
  const handleNewMessage = (message: ChatMessage) => {
    if (!activeUser) return;
    
    // Always update the recentConversations list when there's a new message
    if (message.senderId && message.senderId !== activeUser.id) {
      updateRecentConversation(message.senderId);
    }
    
    // Handle direct messages
    if (!message.groupId) {
      // Message is to current user from someone else
      const isToCurrentUser = (message.receiverId === activeUser.id || 
                              message.assignedUserId === activeUser.id);
                            
      const isFromCurrentUser = (message.senderId === activeUser.id || 
                                message.createdById === activeUser.id);
      
      // If message is to current user and from someone else, update unread count
      if (isToCurrentUser && !isFromCurrentUser && message.senderId) {
        setState(prev => {
          const senderId = message.senderId || '';
          const currentCount = prev.unreadMessagesByUser[senderId] || 0;
          
          return {
            ...prev,
            unreadMessagesByUser: {
              ...prev.unreadMessagesByUser,
              [senderId]: currentCount + 1
            }
          };
        });
      }
      
      if (state.selectedUser) {
        // Only update the conversation if the message is part of the current conversation
        const isFromSelectedUser = (message.senderId === state.selectedUser.id || 
                                  message.createdById === state.selectedUser.id);
        const isToSelectedUser = (message.receiverId === state.selectedUser.id || 
                                message.assignedUserId === state.selectedUser.id);
        
        if ((isFromSelectedUser && isToCurrentUser) || (isFromCurrentUser && isToSelectedUser)) {
          updateConversationWithNewMessage(message);
          
          // Clear unread count for this conversation since it's open
          if (isFromSelectedUser && state.unreadMessagesByUser[state.selectedUser.id]) {
            setState(prev => ({
              ...prev,
              unreadMessagesByUser: {
                ...prev.unreadMessagesByUser,
                [state.selectedUser!.id]: 0
              }
            }));
          }
          
          // Mark the message as delivered since the conversation is open
          if (isToCurrentUser && message.status === MessageStatus.SENT) {
            ChatService.updateMessageStatus(message.id, MessageStatus.DELIVERED);
          }
        }
      }
    }
    
    // Handle group messages
    if (message.groupId) {
      if (state.selectedGroup && message.groupId === state.selectedGroup.id) {
        updateConversationWithNewMessage(message);
        
        // Mark group message as seen if the group chat is open
        if (message.senderId !== activeUser.id) {
          GroupChatService.markMessageAsSeen(message.id, activeUser.id);
        }
      } else {
        // Group message notification if the group chat is not open
        // Track unread group messages using groupId
        const groupId = message.groupId;
        if (groupId && message.senderId !== activeUser.id) {
          setState(prev => {
            const currentCount = prev.unreadMessagesByUser[groupId] || 0;
            
            return {
              ...prev,
              unreadMessagesByUser: {
                ...prev.unreadMessagesByUser,
                [groupId]: currentCount + 1
              }
            };
          });
        }
      }
    }
  };
  
  // Helper function to update conversation with new message
  const updateConversationWithNewMessage = (message: ChatMessage) => {
    setState(prev => {
      // Check if message already exists
      const exists = prev.conversationMessages.some(msg => msg.id === message.id);
      
      if (!exists) {
        // Update delivered status if message is for current user
        const isToCurrentUser = (message.receiverId === activeUser?.id || 
                                message.assignedUserId === activeUser?.id);
        
        if (isToCurrentUser && message.status === MessageStatus.SENT) {
          ChatService.updateMessageStatus(message.id, MessageStatus.DELIVERED);
        }
        
        // If the sender is not the current user, update their activity status
        if (message.senderId !== activeUser?.id && message.senderId) {
          UserStatusService.updateUserActivity(message.senderId);
        }
        
        return {
          ...prev,
          conversationMessages: [...prev.conversationMessages, message],
          error: null,
        };
      }
      
      return prev;
    });
  };
  
  // Add this function to update the recent conversations list
  const updateRecentConversation = async (userId: string) => {
    if (!activeUser || !userId) return;
    
    try {
      // Find user in allUsers
      const user = state.allUsers.find(u => u.id === userId);
      if (!user) return;
      
      setState(prev => {
        // Check if user is already in recentConversations
        const isAlreadyRecent = prev.recentConversations.some(rc => rc.id === userId);
        
        if (isAlreadyRecent) {
          // Move to top if already exists
          const updated = prev.recentConversations.filter(rc => rc.id !== userId);
          return {
            ...prev,
            recentConversations: [user, ...updated],
            users: prev.viewMode === 'recent' ? [user, ...updated] : prev.users
          };
        } else {
          // Add to top if new
          return {
            ...prev,
            recentConversations: [user, ...prev.recentConversations].slice(0, 5),
            users: prev.viewMode === 'recent' ? [user, ...prev.recentConversations].slice(0, 5) : prev.users
          };
        }
      });
    } catch (error) {
      console.error('Failed to update recent conversations:', error);
    }
  };
  
  // Load users and recent conversations
  useEffect(() => {
    const loadUsers = async () => {
      if (!activeUser) return;
      
      setState(prev => ({ ...prev, isLoadingUsers: true }));
      
      try {
        // Load all users
        const allUsers = await ChatService.getAllUsers();
        
        // Set up status subscriptions for all users
        const userStatuses: Record<string, UserStatus> = {};
        allUsers.forEach(user => {
          const status = UserStatusService.getUserStatus(user.id);
          userStatuses[user.id] = status;
          
          // Subscribe to status changes
          UserStatusService.subscribeToUserStatus(user.id, (newStatus) => {
            setState(prev => ({
              ...prev,
              userStatuses: {
                ...prev.userStatuses,
                [user.id]: newStatus
              }
            }));
          });
        });
        
        setState(prev => ({ 
          ...prev, 
          allUsers,
          userStatuses
        }));
        
// Load recent conversations
try {
  // First get the recent conversation partner IDs
  const recentConversationsData = await ChatService.getRecentConversations(5);
  
  // Check if we got actual data or just IDs
  let recentPartnerIds: string[] = [];
  let conversationTimestamps: Record<string, string> = {}; // To store timestamp by user ID
  
  if (Array.isArray(recentConversationsData)) {
    // Simple array of IDs (original implementation)
    recentPartnerIds = recentConversationsData;
  } else if (recentConversationsData && typeof recentConversationsData === 'object') {
    // Enhanced implementation with timestamps
    recentPartnerIds = recentConversationsData.partnerIds || [];
    conversationTimestamps = recentConversationsData.timestamps || {};
  }
  
  // Map IDs to user objects and ensure uniqueness
  const userMap = new Map(allUsers.map(user => [user.id, user]));
  
  // Ensure unique users by using a Set
  const uniqueRecentUserIds = [...new Set(recentPartnerIds)];
  let recentUsers = uniqueRecentUserIds
    .map(id => {
      const user = userMap.get(id);
      
      if (user && conversationTimestamps[id]) {
        // Add the timestamp to the user object
        return {
          ...user,
          lastMessageTimestamp: conversationTimestamps[id]
        };
      }
      
      return user;
    })
    .filter((user): user is EspoCRMUser => !!user);
  
  setState(prev => ({ 
    ...prev, 
    recentConversations: recentUsers,
    users: prev.viewMode === 'recent' ? recentUsers : prev.users,
    error: null,
  }));
} catch (error) {
  console.error('Failed to load recent conversations:', error);
  setState(prev => ({ 
    ...prev, 
    recentConversations: [],
    users: prev.viewMode === 'recent' ? [] : prev.users
  }));
}
        
        // Load groups
        try {
          const groups = await GroupChatService.getUserGroups(activeUser.id);
          setState(prev => ({ ...prev, groups }));
        } catch (error) {
          console.error('Failed to load groups:', error);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to load users'
        }));
      } finally {
        setState(prev => ({ ...prev, isLoadingUsers: false }));
      }
    };
    
    loadUsers();
  }, [activeUser]);
  
  // Load conversation when a user is selected
  useEffect(() => {
    // Early return if either user is null
    if (!state.selectedUser || !activeUser) return;
    
    // Clear any selected group
    setState(prev => ({ 
      ...prev, 
      selectedGroup: null,
      // FIX: Clear search term when entering a conversation
      searchTerm: ''
    }));
    
    const loadConversation = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        // We already checked that state.selectedUser is not null above,
        // but TypeScript doesn't track this through the async function
        // So we need to check again to make TypeScript happy
        if (!state.selectedUser) {
          // This shouldn't happen due to our check above, but TypeScript requires it
          setState(prev => ({ 
            ...prev, 
            isLoading: false,
            error: 'User not found' 
          }));
          return;
        }
        
        const messages = await ChatService.getConversation(state.selectedUser.id);
        
        // Now we can safely use state.selectedUser without the non-null assertion
        setState(prev => {
          // Ensure we have the current selectedUser (could have changed during async operation)
          if (!state.selectedUser) return prev;
          
          return {
            ...prev,
            conversationMessages: messages,
            viewMode: 'conversation',
            error: null,
            // Clear unread count for this user since the conversation is now open
            unreadMessagesByUser: {
              ...prev.unreadMessagesByUser,
              [state.selectedUser.id]: 0
            }
          };
        });
        
        // Mark received messages as delivered
        messages
          .filter(msg => {
            // Since we're inside a filter, we need to check again
            if (!state.selectedUser || !activeUser) return false;
            
            const isFromSelectedUser = (msg.senderId === state.selectedUser.id || 
                                        msg.createdById === state.selectedUser.id);
            const isToCurrentUser = (msg.receiverId === activeUser.id || 
                                     msg.assignedUserId === activeUser.id);
            return isFromSelectedUser && isToCurrentUser && msg.status === MessageStatus.SENT;
          })
          .forEach(msg => {
            ChatService.updateMessageStatus(msg.id, MessageStatus.DELIVERED);
          });
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to load conversation',
          isLoading: false // Also set isLoading to false here to be safe
        }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadConversation();
  }, [state.selectedUser, activeUser]);
  
  // Load group conversation when a group is selected
  useEffect(() => {
    if (!state.selectedGroup || !activeUser) return;
    
    // Clear any selected user
    setState(prev => ({ 
      ...prev, 
      selectedUser: null,
      // FIX: Clear search term when entering a group conversation
      searchTerm: ''
    }));
    
    const loadGroupConversation = async () => {
      setState(prev => ({ ...prev, isLoading: true }));
      
      try {
        if (!state.selectedGroup) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Group not found' }));
          return;
        }
        const messages = await GroupChatService.getGroupMessages(state.selectedGroup.id);
                
        setState(prev => ({
          ...prev,
          conversationMessages: messages,
          viewMode: 'groupChat',
          error: null,
          // Clear unread count for this group since the conversation is now open
          unreadMessagesByUser: {
            ...prev.unreadMessagesByUser,
            [state.selectedGroup!.id]: 0
          }
        }));
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Failed to load group conversation'
        }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadGroupConversation();
  }, [state.selectedGroup, activeUser]);
  
  // Filter users based on search term
  useEffect(() => {
    // FIX: Handle empty search term to return to recent conversations
    if (state.searchTerm === '' && (state.viewMode === 'allUsers' || state.viewMode === 'recent')) {
      setState(prev => ({ 
        ...prev, 
        viewMode: 'recent',
        users: prev.recentConversations.length ? prev.recentConversations : prev.allUsers.slice(0, 5)
      }));
    } 
    else if (state.viewMode === 'allUsers') {
      const filtered = state.allUsers.filter(user =>
        user.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (user.userName && user.userName.toLowerCase().includes(state.searchTerm.toLowerCase()))
      );
      setState(prev => ({ ...prev, users: filtered }));
    } 
    else if (state.viewMode === 'recent' && state.searchTerm) {
      const filtered = state.allUsers.filter(user =>
        user.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (user.userName && user.userName.toLowerCase().includes(state.searchTerm.toLowerCase()))
      );
      setState(prev => ({ ...prev, viewMode: 'allUsers', users: filtered }));
    }
    else if (state.viewMode === 'groups' && state.searchTerm) {
      // Filter groups by name
      const filtered = state.groups.filter(group =>
        group.name.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
      setState(prev => ({ ...prev, groups: filtered }));
    }
    else if (state.viewMode === 'groups' && state.searchTerm === '') {
      // Reset groups when search is cleared
      if (activeUser) { // Add null check
        GroupChatService.getUserGroups(activeUser.id)
          .then(groups => {
            setState(prev => ({ ...prev, groups }));
          })
          .catch(error => {
            console.error('Failed to load groups:', error);
          });
      } else {
        // Handle case when activeUser is null
        console.warn('Cannot load groups: No active user');
        setState(prev => ({ ...prev, error: 'Please sign in to view groups' }));
      }
    }
  }, [state.searchTerm, state.viewMode, state.allUsers, state.recentConversations, state.groups, activeUser?.id]);
  
  // Handle file selection
  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Handle file change - updated to handle arrays
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file
    const validation = FileUploadService.validateFile(file);
    if (!validation.valid) {
      setState(prev => ({ 
        ...prev, 
        error: validation.error || null // Convert undefined to null
      }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      selectedFiles: [...prev.selectedFiles, file],
      error: null 
    }));
  };
  
  // Handle file upload - updated to handle arrays
  const handleFileUpload = async (): Promise<FileAttachment[]> => {
    if (state.selectedFiles.length === 0 || !activeUser) return [];
    
    setState(prev => ({ ...prev, isAttachmentUploading: true }));
    
    try {
      // Upload files
      const parentType = state.selectedGroup ? 'ChatGroup' : 'ChatMessage';
      const parentId = state.selectedGroup 
        ? state.selectedGroup.id 
        : (state.selectedUser ? state.selectedUser.id : activeUser.id);
      
      const attachments = await FileUploadService.uploadMultipleFiles(
        state.selectedFiles,
        parentType,
        parentId,
        'attachments' // Use correct field name
      );
      
      setState(prev => ({ 
        ...prev, 
        selectedAttachments: [...prev.selectedAttachments, ...attachments],
        selectedFiles: [],
        isAttachmentUploading: false 
      }));
      
      return attachments;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to upload file',
        isAttachmentUploading: false 
      }));
      return [];
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setState(prev => ({ 
      ...prev, 
      newMessage: prev.newMessage + emoji,
      isEmojiPickerOpen: false 
    }));
  };
  
  // Handle sending a message - updated for arrays
  const handleSendMessage = async () => {
    if ((!state.newMessage.trim() && state.selectedFiles.length === 0 && state.selectedAttachments.length === 0) || 
        (!state.selectedUser && !state.selectedGroup) || 
        !activeUser) return;
    
    setState(prev => ({ ...prev, isSending: true }));
    
    try {
      let attachments = [...state.selectedAttachments];
      
      // Upload files if selected but not yet uploaded
      if (state.selectedFiles.length > 0) {
        const newAttachments = await handleFileUpload();
        attachments = [...attachments, ...newAttachments];
      }
      
      if (state.selectedGroup) {
        // Send group message
        await sendGroupMessage(attachments);
      } else if (state.selectedUser) {
        // Send direct message
        await sendDirectMessage(attachments);
      }
      
      // Clear attachments and message
      setState(prev => ({
        ...prev,
        selectedAttachments: [],
        newMessage: '',
        isSending: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to send message',
        isSending: false
      }));
    }
  };

    // Add this function alongside your other handler functions in PopupChat.tsx
// Add or update this function in PopupChat.tsx
const handleStartNewConversation = () => {
  setState(prev => ({ 
    ...prev, 
    searchTerm: '', 
    viewMode: 'allUsers', 
    selectedUser: null,
    selectedGroup: null,
    // Important: Set the users list to ALL available users
    users: prev.allUsers 
  }));
};
  
  // Send direct message - updated for multiple attachments
  const sendDirectMessage = async (attachments: FileAttachment[]) => {
    if (!state.selectedUser || !activeUser) return;
    
    // Get attachment IDs
    const attachmentIds = attachments.map(att => att.id);
    
    // Determine message type based on attachments
    const msgType = attachments.length > 0 ? 
                    (attachments[0].type?.startsWith('image/') ? 'image' : 'file') :
                    'text';
    
    const messagePayload: Omit<ChatMessage, 'id'> = {
      senderId: activeUser.id,
      receiverId: state.selectedUser.id,
      message: state.newMessage.trim() || (attachments.length > 0 ? 'Sent attachment' : ''),
      status: MessageStatus.PENDING, // Start as pending
      senderName: activeUser.name,
      receiverName: state.selectedUser.name,
      // Add name for EspoCRM
      name: `Message to ${state.selectedUser.name}`,
      // Add type
      type: msgType,
      // Use attachments array
      attachments: attachments
    };
    
    // Create optimistic message for UI
    const now = Date.now();
    const optimisticMessage: ChatMessage = { 
      ...messagePayload, 
      id: `temp-${now}`,
      timestamp: now,
      // Generate an ISO date string for createdAt
      createdAt: new Date(now).toISOString()
    };
    
    // Add optimistic message to state
    setState(prev => ({
      ...prev,
      conversationMessages: [...prev.conversationMessages, optimisticMessage]
    }));
    
    try {
      // Send message to server with attachments
      const sentMessage = await ChatService.sendMessage(messagePayload, attachmentIds);
      
      // Replace optimistic message with actual message
      setState(prev => ({
        ...prev,
        conversationMessages: prev.conversationMessages.map(msg =>
          msg.id === optimisticMessage.id ? 
          { ...sentMessage, attachments: attachments } : // Keep the attachment info for UI
          msg
        )
      }));
      
      // Update recent conversations to show this user at the top
      updateRecentConversation(state.selectedUser.id);
    } catch (error) {
      setState(prev => ({
        ...prev,
        conversationMessages: prev.conversationMessages.map(msg =>
          msg.id === optimisticMessage.id ? { ...msg, status: MessageStatus.FAILED } : msg
        ),
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
      throw error;
    }
  };
  
  // Send group message - updated for multiple attachments
  const sendGroupMessage = async (attachments: FileAttachment[]) => {
    if (!state.selectedGroup || !activeUser) return;
    
    // Get attachment IDs
    const attachmentIds = attachments.map(att => att.id);
    
    // Determine message type based on attachments
    const msgType = attachments.length > 0 ? 
                    (attachments[0].type?.startsWith('image/') ? 'image' : 'file') :
                    'text';
    
    // Create optimistic message for UI
    const now = Date.now();
    const optimisticMessage: ChatMessage = { 
      id: `temp-${now}`,
      message: state.newMessage.trim() || (attachments.length > 0 ? 'Sent attachment' : ''),
      senderId: activeUser.id,
      senderName: activeUser.name,
      groupId: state.selectedGroup.id,
      status: MessageStatus.PENDING,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
      type: msgType,
      attachments: attachments
    };
    
    // Add optimistic message to state
    setState(prev => ({
      ...prev,
      conversationMessages: [...prev.conversationMessages, optimisticMessage]
    }));
    
    try {
      // Send message to server with attachments
      const sentMessage = await GroupChatService.sendGroupMessage(
        optimisticMessage.message,
        state.selectedGroup.id,
        activeUser.id,
        activeUser.name,
        msgType,
        attachmentIds
      );
      
      // Replace optimistic message with actual message
      setState(prev => ({
        ...prev,
        conversationMessages: prev.conversationMessages.map(msg =>
          msg.id === optimisticMessage.id ? 
          { ...sentMessage, attachments: attachments } : // Keep attachment info for UI
          msg
        )
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        conversationMessages: prev.conversationMessages.map(msg =>
          msg.id === optimisticMessage.id ? { ...msg, status: MessageStatus.FAILED } : msg
        ),
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
      throw error;
    }
  };
  
  // Handle refreshing the conversation
  const handleRefresh = async () => {
    if ((!state.selectedUser && !state.selectedGroup) || !activeUser) return;
    
    setState(prev => ({ 
      ...prev, 
      isRefreshing: true, 
      connectionStatus: 'reconnecting' 
    }));
    
    try {
      if (state.selectedUser) {
        const messages = await ChatService.getConversation(state.selectedUser.id);
        
        setState(prev => ({
          ...prev,
          conversationMessages: messages,
          connectionStatus: 'online',
          error: null,
        }));
      } else if (state.selectedGroup) {
        const messages = await GroupChatService.getGroupMessages(state.selectedGroup.id);
        
        setState(prev => ({
          ...prev,
          conversationMessages: messages,
          connectionStatus: 'online',
          error: null,
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to refresh conversation',
      }));
    } finally {
      setState(prev => ({ ...prev, isRefreshing: false }));
    }
  };
  
  // Handle creating a new group
  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    if (!activeUser) return;
    
    try {
      // Make sure the current user is included in members
      if (!memberIds.includes(activeUser.id)) {
        memberIds.push(activeUser.id);
      }
      
      // Create group
      const newGroup = await GroupChatService.createGroup(
        name,
        memberIds,
        activeUser.id
      );
      
      // Add group to state
      setState(prev => ({
        ...prev,
        groups: [...prev.groups, newGroup],
        selectedGroup: newGroup,
        viewMode: 'groupChat',
        isCreateGroupModalOpen: false,
        error: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create group',
        isCreateGroupModalOpen: false
      }));
    }
  };
  
  // Show login reminder if no active user
  if (!activeUser) {
    return (
      <div className="fixed bottom-4 right-4 w-96 h-[700px] bg-aspro rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
        <div className="text-center p-4">
          <div className="mb-4 text-gray-400">
            <MessageCircle size={40} className="mx-auto" />
          </div>
          <h3 className="font-medium text-lg mb-2">Sign in Required</h3>
          <p className="text-gray-500 text-sm mb-4">
            Please sign in to your account to access the chat.
          </p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  // Updated to show multiple selected files
  const renderSelectedFiles = () => {
    if (state.selectedFiles.length === 0) return null;
    
    return (
      <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
        <div className="text-sm font-medium text-blue-700 mb-1">Selected files:</div>
        {state.selectedFiles.map((file, index) => (
          <div key={index} className="flex items-center justify-between mb-1">
            <div className="text-sm text-blue-700 truncate">
              <PaperclipIcon size={14} className="inline mr-1" />
              {file.name}
            </div>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => {
                setState(prev => ({
                  ...prev,
                  selectedFiles: prev.selectedFiles.filter((_, i) => i !== index)
                }));
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  // Helper function to get total unread messages count
  const getTotalUnreadCount = (): number => {
    return Object.values(state.unreadMessagesByUser).reduce((sum, count) => sum + count, 0);
  };
  
  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] md:h-[700px] bg-aspro rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
      <ChatHeader
        viewMode={state.viewMode}
        selectedUser={state.selectedUser}
        selectedGroup={state.selectedGroup}
        userStatus={state.selectedUser ? state.userStatuses[state.selectedUser.id] : undefined}
        onBack={() => setState(prev => ({ 
          ...prev, 
          selectedUser: null, 
          selectedGroup: null,
          viewMode: prev.viewMode === 'groupChat' ? 'groups' : 'recent',
          searchTerm: ''
        }))}
        onClose={onClose || (() => {})}
      />
      
      {/* Navigation tabs with unread count badges */}
      <div className="flex border-b">
      <button
  className={`flex-1 py-1 md:py-2 text-xs md:text-sm font-medium relative ${
    state.viewMode === 'recent' || state.viewMode === 'allUsers' || state.viewMode === 'conversation'
      ? 'text-blue-600 border-b-2 border-blue-600'
      : 'text-gray-500 hover:text-gray-700'
  }`}
  onClick={() => setState(prev => ({ 
    ...prev, 
    viewMode: 'recent',
    selectedUser: null,
    selectedGroup: null,
    searchTerm: '',
    // Important: Set users to recentConversations when switching back to recent mode
    users: prev.recentConversations
  }))}
>
  <User size={14} className="inline mr-1" /> <span className="md:inline">Chats</span>
        {/* Show unread count for direct messages */}
          {(state.viewMode === 'groups' || state.viewMode === 'groupChat') && 
           Object.entries(state.unreadMessagesByUser)
             .filter(([id]) => state.allUsers.some(user => user.id === id))
             .reduce((sum, [_, count]) => sum + count, 0) > 0 && (
            <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {Object.entries(state.unreadMessagesByUser)
                .filter(([id]) => state.allUsers.some(user => user.id === id))
                .reduce((sum, [_, count]) => sum + count, 0)}
            </span>
          )}
        </button>
        <button
          className={`flex-1 py-1 md:py-2 text-xs md:text-sm font-medium relative ${
            state.viewMode === 'groups' || state.viewMode === 'groupChat'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setState(prev => ({ 
            ...prev, 
            viewMode: 'groups',
            selectedUser: null,
            selectedGroup: null,
            searchTerm: '' 
          }))}
        >
        <Users size={14} className="inline mr-1" /> <span className="md:inline">Groups</span>
        {/* Show unread count for group messages */}
          {(state.viewMode === 'recent' || state.viewMode === 'allUsers' || state.viewMode === 'conversation') && 
           Object.entries(state.unreadMessagesByUser)
             .filter(([id]) => state.groups.some(group => group.id === id))
             .reduce((sum, [_, count]) => sum + count, 0) > 0 && (
            <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {Object.entries(state.unreadMessagesByUser)
                .filter(([id]) => state.groups.some(group => group.id === id))
                .reduce((sum, [_, count]) => sum + count, 0)}
            </span>
          )}
        </button>
      </div>
      
      {/* Search bar - FIX: Hide when in conversation/groupChat mode */}
      {state.viewMode !== 'conversation' && state.viewMode !== 'groupChat' && (
        <div className="p-2 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder={
                state.viewMode === 'allUsers' 
                  ? 'Search for people' 
                  : state.viewMode === 'groups' 
                    ? 'Search groups' 
                    : 'Search'
              }
              className="w-full pl-10 pr-4 py-2 rounded-full border focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              value={state.searchTerm}
              onChange={(e) => setState(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            
            {/* Create new group button (only on groups tab) */}
            {state.viewMode === 'groups' && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
                onClick={() => setState(prev => ({ ...prev, isCreateGroupModalOpen: true }))}
                aria-label="Create new group"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {state.connectionStatus !== 'online' && (
        <div
          className={`px-3 py-1 text-xs flex items-center justify-between ${
            state.connectionStatus === 'offline' 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          <div className="flex items-center">
            {state.connectionStatus === 'offline' ? (
              <WifiOff size={12} className="mr-1" />
            ) : (
              <Loader2 size={12} className="mr-1 animate-spin" />
            )}
            {state.connectionStatus === 'offline' ? 'Offline mode' : 'Reconnecting...'}
          </div>
          {state.connectionStatus === 'offline' && 
           (state.viewMode === 'conversation' || state.viewMode === 'groupChat') && (
            <button
              onClick={handleRefresh}
              disabled={state.isRefreshing}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              {state.isRefreshing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} className="mr-1" />
              )}
              <span>Refresh</span>
            </button>
          )}
        </div>
      )}
      
      {state.error && (
        <div className="px-3 py-1 text-xs text-red-600">{state.error}</div>
      )}
      
      <div className="flex flex-1 overflow-hidden" ref={chatWindowRef}>
      {/* Conversations and Group Chats */}
        {(state.viewMode === 'conversation' && state.selectedUser) || 
         (state.viewMode === 'groupChat' && state.selectedGroup) ? (
          <div className="flex-1 flex flex-col">
            {state.viewMode === 'conversation' && state.selectedUser ? (
              <ConversationView
                messages={state.conversationMessages}
                isLoading={state.isLoading}
                activeUser={activeUser}
                selectedUser={state.selectedUser}
              />
            ) : state.selectedGroup && (
              <GroupConversation
                messages={state.conversationMessages}
                isLoading={state.isLoading}
                activeUser={activeUser}
                selectedGroup={state.selectedGroup}
                userStatuses={state.userStatuses}
              />
            )}
            
            {/* Display selected files */}
            {renderSelectedFiles()}
            
            {/* Message input */}
            <div className="relative message-input-container">
              <MessageInput
                newMessage={state.newMessage}
                isSending={state.isSending || state.isAttachmentUploading}
                onMessageChange={(value) => setState(prev => ({ ...prev, newMessage: value }))}
                onSendMessage={handleSendMessage}
                onAttachmentClick={handleFileSelect}
                onEmojiClick={() => setState(prev => ({ ...prev, isEmojiPickerOpen: !prev.isEmojiPickerOpen }))}
              />
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              {/* Emoji picker */}
              {state.isEmojiPickerOpen && (
                <EmojiPicker
                  onEmojiSelect={handleEmojiSelect}
                  onClose={() => setState(prev => ({ ...prev, isEmojiPickerOpen: false }))}
                />
              )}
            </div>
          </div>
        ) : (
          // User and group lists
          <div className="flex-1 flex flex-col">
{state.viewMode === 'groups' ? (
  <GroupList
    groups={state.groups}
    isLoading={state.isLoadingUsers}
    searchTerm={state.searchTerm}
    unreadMessagesByGroup={state.unreadMessagesByUser}
    onSelectGroup={(group) => setState(prev => ({ ...prev, selectedGroup: group }))}
  />
) : (
  <UserList
    users={state.users}
    userStatuses={state.userStatuses}
    isLoadingUsers={state.isLoadingUsers}
    viewMode={state.viewMode}
    searchTerm={state.searchTerm}
    unreadMessagesByUser={state.unreadMessagesByUser}
    onSelectUser={(user) => setState(prev => ({ ...prev, selectedUser: user }))}
    onStartNewConversation={handleStartNewConversation} // Use the new handler here
  />
)}
          </div>
        )}
      </div>
      
      {/* Create group modal */}
      {state.isCreateGroupModalOpen && (
        <CreateGroupModal
          users={state.allUsers}
          onSubmit={handleCreateGroup}
          onCancel={() => setState(prev => ({ ...prev, isCreateGroupModalOpen: false }))}
        />
      )}
    </div>
  );
};

export default PopupChat;