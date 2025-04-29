import { NextResponse } from 'next/server';

export async function GET() {
  // Return socket configuration
  return NextResponse.json({
    url: process.env.WEBSOCKET_URL || 'http://localhost:4003',
    path: '/ws/chat'
  });
}