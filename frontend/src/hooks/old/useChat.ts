import { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { IMessage, IUser } from '@/types/chat';

interface UseChatProps {
  currentUser: string;
  otherUser: string;
}

interface UseChatReturn {
  messages: IMessage[];
  sendMessage: (content: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useChat = ({ currentUser, otherUser }: UseChatProps): UseChatReturn => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io('http://192.168.4.20:3000');
    setSocket(socketInstance);

    // Join private room
    socketInstance.emit('join', { userId: currentUser });

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/messages?userId=${currentUser}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }

        const data = await response.json();
        setMessages(data.filter((msg: IMessage) => 
          (msg.sender === currentUser && msg.receiver === otherUser) ||
          (msg.sender === otherUser && msg.receiver === currentUser)
        ));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Listen for new messages
    socketInstance.on('newMessage', (message: IMessage) => {
      if (
        (message.sender === currentUser && message.receiver === otherUser) ||
        (message.sender === otherUser && message.receiver === currentUser)
      ) {
        setMessages(prev => [...prev, message]);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [currentUser, otherUser]);

  const sendMessage = async (content: string): Promise<void> => {
    try {
      const message: Omit<IMessage, '_id'> = {
        sender: currentUser,
        receiver: otherUser,
        content,
        timestamp: new Date(),
        read: false
      };

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      socket?.emit('sendMessage', message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      throw err;
    }
  };

  return { messages, sendMessage, loading, error };
};