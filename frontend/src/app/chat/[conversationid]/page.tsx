"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import ChatContainer from '@/components/Chat/ChatContainer';
import AuthenticatedLayout from '@/components/layouts/AuthenticatedLayout';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

export default function ConversationPage() {
  const { isLoading, user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [conversation, setConversation] = useState<any>(null);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const conversationId = params?.conversationId as string;

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchConversation = async () => {
      try {
        setLoadingConversation(true);
        const data = await apiClient.get(`/chat/conversations/${conversationId}`);
        setConversation(data);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation',
          variant: 'destructive',
        });
        router.push('/chat');
      } finally {
        setLoadingConversation(false);
      }
    };

    fetchConversation();
  }, [conversationId, user, router]);

  if (isLoading || loadingConversation) {
    return <LoadingScreen />;
  }

  return (
    <AuthenticatedLayout>
      <div className="h-full flex flex-col bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Chat</h1>
          <p className="mt-1 text-sm text-gray-500">
            {conversation?.name || 'Conversation'}
          </p>
        </div>
        
        <div className="flex-1 overflow-hidden">
          {/* Fixed: Pass initialConversation as a prop */}
          <ChatContainer initialConversation={conversation} />
        </div>
      </div>
    </AuthenticatedLayout>
  );
}