// src/app/api/timeline/work-details/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Base URL for Encore backend
const ENCORE_API_URL = process.env.ENCORE_API_URL || 'http://localhost:4000';

/**
 * GET handler for fetching work details
 */
export async function GET(request: NextRequest) {
  try {
    // Get parameters from query params
    const searchParams = request.nextUrl.searchParams;
    const recordId = searchParams.get('recordId');
    const appointmentType = searchParams.get('appointmentType') || undefined;
    
    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`API route: Fetching work details for recordId: ${recordId}, type: ${appointmentType}`);
    
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value || '';
    
    // Build URL for backend
    const url = new URL('/timeline/work-details', ENCORE_API_URL);
    url.searchParams.append('recordId', recordId);
    if (appointmentType) {
      url.searchParams.append('appointmentType', appointmentType);
    }
    
    // Create headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    console.log(`Making request to: ${url.toString()}`);
    
    // Make request to backend
    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error ${response.status} fetching work details:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch work details', details: errorText },
        { status: response.status }
      );
    }
    
    // Return response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in work details API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}