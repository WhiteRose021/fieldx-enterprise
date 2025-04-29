"use client";

import React, { useEffect, useState } from 'react';
import useSocket from '@/hooks/useSocket';
import { apiClient } from '@/lib/api-client';

interface NotificationIndicatorProps {
  className?: string;
}

const NotificationIndicator: React.FC<NotificationIndicatorProps> = ({ className }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    // Fetch initial unread count
    fetchUnreadCount();

    // Set up socket listener for new notifications
    if (socket) {
      socket.on('notification:new', handleNewNotification);
      
      return () => {
        socket.off('notification:new');
      };
    }
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const data = await apiClient.get<{ count: number }>('/chat/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleNewNotification = () => {
    setUnreadCount(prev => prev + 1);
  };

  if (unreadCount === 0) return null;

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${className || ''}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};

export default NotificationIndicator;