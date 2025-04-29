import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | FieldX',
  description: 'Real-time messaging for your team'
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}