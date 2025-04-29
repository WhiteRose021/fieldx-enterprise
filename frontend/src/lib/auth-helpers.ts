// frontend/lib/auth-helpers.ts
import TokenManager from '../utils/token-management';

/**
 * Add auth headers to requests
 * This adds the Bearer token from session storage to the Authorization header
 */
export const withAuthHeaders = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const headers: Record<string, string> = {};
  
  // Get access token using token manager
  const token = TokenManager.getAccessToken();
  
  // Add Authorization header with Bearer token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log("Added token to request headers:", { token: `Bearer ${token.substring(0, 15)}...` });
  } else {
    console.warn("No token available for Authorization header");
    
    // Try to get user session directly as a fallback
    const userSession = TokenManager.getUserSession();
    if (userSession?.token) {
      headers['Authorization'] = `Bearer ${userSession.token}`;
      console.log("Added token from user session:", { token: `Bearer ${userSession.token.substring(0, 15)}...` });
    }
  }

  return headers;
};

/**
 * Check if user is authenticated based on session data
 */
export const isAuthenticated = (): boolean => {
  return TokenManager.isAuthenticated();
};

/**
 * Check if session is about to expire
 */
export const isSessionExpiringSoon = (): boolean => {
  return TokenManager.willExpireSoon();
};

/**
 * Get user session data
 */
export const getUserSession = () => {
  return TokenManager.getUserSession();
};

/**
 * Utility function to handle API response errors
 */
export const handleApiError = (error: any): string => {
  console.error("API Error:", error);
  
  if (error instanceof Error) {
    const errorMessage = error.message;
    
    // Check for authentication errors
    if (errorMessage.includes('Authentication required') || 
        errorMessage.includes('401') || 
        errorMessage.includes('token')) {
      // Force a page reload to refresh auth state
      console.log("Authentication error detected - redirecting to login");
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
      return 'Authentication error. Please log in again.';
    }
    
    // Check for server errors
    if (errorMessage.includes('500')) {
      return 'Server error. Please try again later.';
    }
    
    // Return the error message for other errors
    return errorMessage;
  }
  
  return 'An unknown error occurred';
};