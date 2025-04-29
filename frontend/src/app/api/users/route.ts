import { NextRequest, NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// Get all users with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Create parameters object from search params
    const params: Record<string, any> = {};
    
    // Handle active filter
    if (searchParams.has('active')) {
      const activeValue = searchParams.get('active');
      if (activeValue === 'true') {
        params.where = JSON.stringify([{
          type: 'equals',
          attribute: 'isActive',
          value: true
        }]);
      }
    }
    
    // Handle search filter
    if (searchParams.has('search')) {
      params.textFilter = searchParams.get('search');
    }
    
    // Handle pagination
    if (searchParams.has('offset')) {
      params.offset = parseInt(searchParams.get('offset') || '0');
    }
    
    if (searchParams.has('limit')) {
      params.maxSize = parseInt(searchParams.get('limit') || '50');
    }
    
    // Connect to our Encore backend service
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://192.168.4.20:3001'}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Connect to our Encore backend service
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://192.168.4.20:3001'}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error creating user:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';