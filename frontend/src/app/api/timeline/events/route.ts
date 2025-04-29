// src/app/api/timeline/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Base URL for Encore backend
const ENCORE_API_URL = process.env.ENCORE_API_URL || 'http://localhost:4000';

/**
 * GET handler for fetching timeline events
 */
export async function GET(request: NextRequest) {
  try {
    // Get date from query params
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    console.log(`API route: Fetching timeline events for date: ${date}`);
    
    // Get access token from cookies
    const cookieStore = cookies();
    const accessToken = cookieStore.get('access_token')?.value || '';
    
    // Build URL for backend
    const url = new URL('/timeline/events', ENCORE_API_URL);
    url.searchParams.append('date', date);
    
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
      console.error(`Error ${response.status} fetching timeline events:`, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch timeline events', details: errorText },
        { status: response.status }
      );
    }
    
    // Return response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in timeline events API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}