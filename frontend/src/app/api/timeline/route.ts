import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// Main timeline endpoint to fetch events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const userIdList = searchParams.get('userIdList');
    const scopeList = searchParams.get('scopeList');
    
    // Validate required parameters
    if (!from || !to) {
      return NextResponse.json(
        { error: 'Missing required parameters: from and to' },
        { status: 400 }
      );
    }
    
    // Use the apiClient directly
    const response = await apiClient.getTimelineEvents({
      from,
      to,
      userIdList: userIdList || undefined,
      scopeList: scopeList || undefined
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline events' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';