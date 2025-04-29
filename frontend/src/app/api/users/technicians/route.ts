import { NextResponse } from 'next/server';

// Function to check if a user is a technician based on team names
function isTechnician(user: any): boolean {
  // Check if user belongs to any team with "Technicians" in the name
  const isInTechniciansTeam = user.teamsNames && Object.values(user.teamsNames).some(
    (teamName: any) => typeof teamName === 'string' && teamName.toLowerCase().includes('technician')
  );
  
  // Check if user is active
  const isActive = user.isActive === true;
  
  // Combine criteria - must be active and in a technicians team
  return isActive && isInTechniciansTeam;
}

// Get technicians for timeline filtering
export async function GET() {
  try {
    // This connects directly to EspoCRM API with the correct URL
    const response = await fetch('http://192.168.4.150:8080/api/v1/User?maxSize=100', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed - you might need to add these
        // 'X-Api-Key': process.env.ESPO_API_KEY || '',
      }
    });

    if (!response.ok) {
      throw new Error(`EspoCRM API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Filter for technicians
    const technicians = (data.list || []).filter(isTechnician);
    
    // Return in the expected format
    return NextResponse.json({
      list: technicians,
      total: technicians.length
    });
  } catch (error) {
    console.error('Error fetching technicians:', error);
    
    // Return mock data as fallback in case of error
    const mockTechnicians = {
      list: [
        { id: "user1", name: "Technician 1", type: "regular", isActive: true },
        { id: "user2", name: "Technician 2", type: "regular", isActive: true },
        { id: "user3", name: "Technician 3", type: "regular", isActive: true },
        { id: "user4", name: "Technician 4", type: "regular", isActive: true }
      ],
      total: 4
    };
    
    // Use mock data in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock technician data due to error');
      return NextResponse.json(mockTechnicians);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch technicians' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';