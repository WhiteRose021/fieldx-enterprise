// Create this file: src/app/api/chat/conversations/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const token = request.headers.get('authorization');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Replace with your actual Encore API URL
    const response = await fetch('http://localhost:4000/chat/conversations', {
      headers: {
        'authorization': token
      }
    });
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying to backend:', error);
    return NextResponse.json({ error: 'Backend connection failed' }, { status: 500 });
  }
}