// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import TokenManager from '@/utils/token-management';

// Global socket instance
let socket: Socket | null = null;

export default function useSocket() {
  const { user, isAuthenticated, refreshToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    
    // Use access token for WebSocket auth
    const token = TokenManager.getAccessToken();
    if (!token) return;
    
    const socketInstance = io('/ws/chat', {
      auth: { token },
      path: '/api/sockjs' // Needs to be proxied in Next.js
    });
    
    socketInstance.on('connect', () => {
      console.log('Socket connected');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    setSocket(socketInstance);
    
    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);
  
  return socket;
}