"use client";

import React from 'react';
import ChatContainer from '@/components/Chat/ChatContainer';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

export default function ChatPage() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <AuthenticatedLayout>
      <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Chat</h1>
          <p className="mt-1 text-sm text-gray-500">
            Communicate with your team in real-time
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* No need to pass initialConversation here */}
          <ChatContainer />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}