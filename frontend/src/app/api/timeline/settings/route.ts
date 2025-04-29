import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// Get timeline settings
export async function GET() {
  try {
    const response = await apiClient.get('/timeline/settings');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching timeline settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline settings' },
      { status: 500 }
    );
  }
}

// Save timeline settings
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate request body
    if (!data.eventEntityTypes || !Array.isArray(data.eventEntityTypes)) {
      return NextResponse.json(
        { error: 'Invalid request body. eventEntityTypes must be an array' },
        { status: 400 }
      );
    }
    
    const response = await apiClient.post('/timeline/settings', data);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving timeline settings:', error);
    return NextResponse.json(
      { error: 'Failed to save timeline settings' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';