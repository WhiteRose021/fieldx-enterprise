// import { NextResponse } from 'next/server';
// import { apiClient } from '@/lib/api-client';

// // Get event entity types
// export async function GET() {
//   try {
//     const response = await apiClient.get('/timeline/entity-types');
//     return NextResponse.json(response);
//   } catch (error) {
//     console.error('Error fetching event entity types:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch event entity types' },
//       { status: 500 }
//     );
//   }
// }

// export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { apiClient } from '@/lib/api-client';

// Get event entity types
export async function GET() {
  try {
    // For testing, return a static array of entity types so we can see the UI working
    // You can replace this with the actual API call once the backend is fixed
    const mockEntityTypes = [
      "Meeting", 
      "Call", 
      "Task", 
      "Test", 
      "CKataskeyastikadates", 
      "CEarthWork", 
      "CRantevouEmf", 
      "CSplicingdate", 
      "CLastDropDates", 
      "CVlavesAppointments"
    ];
    
    return NextResponse.json(mockEntityTypes);
    
    // Uncomment this when your backend is fixed:
    // const types = await apiClient.get('/timeline/entity-types');
    // return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching event entity types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event entity types' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';