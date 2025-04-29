'use client';

import { useState, useEffect } from 'react';
import { EspoCRMUser } from '@/services/chat/ChatService';

export function useUserSession() {
  const [user, setUser] = useState<EspoCRMUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('user_session');
        
        if (storedToken) {
          setAuthToken(storedToken);
        }
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error retrieving user session:', error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  return { user, authToken, loading };
}