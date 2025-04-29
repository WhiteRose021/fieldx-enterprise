import { NextRequest, NextResponse } from 'next/server';

// Get, update, or delete a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Connect to our Encore backend service
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://192.168.4.20:3001'}/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      }
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error fetching user:`, error);
    
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    
    // Connect to our Encore backend service
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://192.168.4.20:3001'}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      },
      body: JSON.stringify(data)
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(`Error updating user:`, error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Connect to our Encore backend service
    const response = await fetch(`${process.env.BACKEND_API_URL || 'http://192.168.4.20:3001'}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
      }
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting user:`, error);
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';