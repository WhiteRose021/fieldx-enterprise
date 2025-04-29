// hooks/useAutopsyNavigation.ts
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Site {
  id: string;
  apiSource: string;
}

export const useAutopsyNavigation = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Base API URL
  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.150:8080/api/v1';

  // Traverse parent chain to find Aytopsies1 ID
  const findAytopsies1Id = async (site: Site): Promise<string | null> => {
    const authToken = localStorage.getItem("auth_token");
    if (!authToken) {
      throw new Error("Authentication token not found");
    }

    // Mapping of parent traversal strategies
    const parentTraversalStrategies: { [key: string]: (id: string, token: string) => Promise<string | null> } = {
      // Direct Aytopsies1 entity
      Aytopsies1: async (id) => id,

      // Traverse from Test to Aytopsies1
      Test: async (id, token) => {
        const testResponse = await fetch(`${BASE_URL}/Test/${id}`, {
          headers: { 
            Authorization: `Basic ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        
        if (!testResponse.ok) return null;
        
        const testData = await testResponse.json();
        return testData.parentId || null;
      },

      // Traverse from KataskeyesBFasi to Test to Aytopsies1
      KataskeyesBFasi: async (id, token) => {
        const constructionResponse = await fetch(`${BASE_URL}/KataskeyesBFasi/${id}`, {
          headers: { 
            Authorization: `Basic ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        
        if (!constructionResponse.ok) return null;
        
        const constructionData = await constructionResponse.json();
        
        // If Test record is directly linked
        if (constructionData.parentType === 'Test' && constructionData.parentId) {
          const testResponse = await fetch(`${BASE_URL}/Test/${constructionData.parentId}`, {
            headers: { 
              Authorization: `Basic ${token}`, 
              "Content-Type": "application/json" 
            }
          });
          
          if (!testResponse.ok) return null;
          
          const testData = await testResponse.json();
          return testData.parentId || null;
        }

        return null;
      },

      // Traverse from CKataskeyastikadates to KataskeyesBFasi to Test to Aytopsies1
      CKataskeyastikadates: async (id, token) => {
        const appointmentResponse = await fetch(`${BASE_URL}/CKataskeyastikadates/${id}`, {
          headers: { 
            Authorization: `Basic ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        
        if (!appointmentResponse.ok) return null;
        
        const appointmentData = await appointmentResponse.json();
        
        // Check if it has a parent KataskeyesBFasi
        if (appointmentData.parentType === 'KataskeyesBFasi' && appointmentData.parentId) {
          const constructionResponse = await fetch(`${BASE_URL}/KataskeyesBFasi/${appointmentData.parentId}`, {
            headers: { 
              Authorization: `Basic ${token}`, 
              "Content-Type": "application/json" 
            }
          });
          
          if (!constructionResponse.ok) return null;
          
          const constructionData = await constructionResponse.json();
          
          // If Test record is directly linked
          if (constructionData.parentType === 'Test' && constructionData.parentId) {
            const testResponse = await fetch(`${BASE_URL}/Test/${constructionData.parentId}`, {
              headers: { 
                Authorization: `Basic ${token}`, 
                "Content-Type": "application/json" 
              }
            });
            
            if (!testResponse.ok) return null;
            
            const testData = await testResponse.json();
            return testData.parentId || null;
          }
        }

        return null;
      },

      // Traverse from CSplicingWork to Test to Aytopsies1
      CSplicingWork: async (id, token) => {
        const splicingResponse = await fetch(`${BASE_URL}/CSplicingWork/${id}`, {
          headers: { 
            Authorization: `Basic ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        
        if (!splicingResponse.ok) return null;
        
        const splicingData = await splicingResponse.json();
        
        // If Test record is directly linked
        if (splicingData.parentType === 'Test' && splicingData.parentId) {
          const testResponse = await fetch(`${BASE_URL}/Test/${splicingData.parentId}`, {
            headers: { 
              Authorization: `Basic ${token}`, 
              "Content-Type": "application/json" 
            }
          });
          
          if (!testResponse.ok) return null;
          
          const testData = await testResponse.json();
          return testData.parentId || null;
        }

        return null;
      },

      // Traverse from CEarthWork to CChomatourgika to Test to Aytopsies1
      CEarthWork: async (id, token) => {
        const earthWorkResponse = await fetch(`${BASE_URL}/CEarthWork/${id}`, {
          headers: { 
            Authorization: `Basic ${token}`, 
            "Content-Type": "application/json" 
          }
        });
        
        if (!earthWorkResponse.ok) return null;
        
        const earthWorkData = await earthWorkResponse.json();
        
        // Check if it has a parent CChomatourgika
        if (earthWorkData.parentType === 'CChomatourgika' && earthWorkData.parentId) {
          const chomatourgikaResponse = await fetch(`${BASE_URL}/CChomatourgika/${earthWorkData.parentId}`, {
            headers: { 
              Authorization: `Basic ${token}`, 
              "Content-Type": "application/json" 
            }
          });
          
          if (!chomatourgikaResponse.ok) return null;
          
          const chomatourgikaData = await chomatourgikaResponse.json();
          
          // If Test record is directly linked
          if (chomatourgikaData.parentType === 'Test' && chomatourgikaData.parentId) {
            const testResponse = await fetch(`${BASE_URL}/Test/${chomatourgikaData.parentId}`, {
              headers: { 
                Authorization: `Basic ${token}`, 
                "Content-Type": "application/json" 
              }
            });
            
            if (!testResponse.ok) return null;
            
            const testData = await testResponse.json();
            return testData.parentId || null;
          }
        }

        return null;
      },

      // Default strategy (no traversal possible)
      Default: async () => null
    };

    // Determine the traversal strategy
    const traversalStrategy = parentTraversalStrategies[site.apiSource] || parentTraversalStrategies.Default;
    
    // Apply the traversal strategy
    return await traversalStrategy(site.id, authToken);
  };

  const navigateToAutopsy = async (site: Site) => {
    setLoading(true);
    setError(null);

    try {
      const autopsyId = await findAytopsies1Id(site);

      if (autopsyId) {
        console.log(`Navigating to Autopsies with ID: ${autopsyId}`);
        router.push(`/FTTHBPhase/Autopsies/${autopsyId}`);
      } else {
        console.log(`No matching Aytopsies1 record found for ${site.apiSource} with ID: ${site.id}`);
        alert(`Δεν βρέθηκε αντίστοιχη αυτοψία`);
        router.push('/FTTHBPhase/Autopsies');
      }

    } catch (err: any) {
      console.error("Error navigating to autopsy:", err);
      setError(err.message || "An error occurred while navigating to the autopsy page");
      
      // On error, redirect to main Autopsies page
      router.push('/FTTHBPhase/Autopsies');
    } finally {
      setLoading(false);
    }
  };

  return { 
    navigateToAutopsy, 
    findAytopsies1Id,  // Expose this method for direct use if needed
    loading, 
    error 
  };
};

export default useAutopsyNavigation;