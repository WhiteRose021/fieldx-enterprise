import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// Get technicians who can have events assigned to them
export async function GET() {
  try {
    // Use await with Promise since the .get() method returns a Promise
    const response = await fetch(`${apiClient['baseUrl']}/users`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return NextResponse.json(
      { error: 'Failed to fetch technicians' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';