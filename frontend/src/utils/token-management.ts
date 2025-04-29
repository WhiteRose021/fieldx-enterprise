// utils/token-management.ts

// Constants
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';
const USER_SESSION_KEY = 'user_session';

/**
 * Utility functions for token management
 */
const TokenManager = {
  /**
   * Set both tokens at once for consistency
   */
  setTokens: (accessToken: string, refreshToken: string): void => {
    if (!accessToken || !refreshToken) {
      console.warn("Attempted to store empty tokens");
      return;
    }
    
    // Store access token in sessionStorage for better security
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    
    // Store refresh token in localStorage for persistence
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    console.log("Tokens stored successfully");
  },
  
  /**
   * Get the access token
   */
  getAccessToken: (): string | null => {
    // First try to get from sessionStorage (primary location)
    const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (sessionToken) return sessionToken;
    
    // Fallback to localStorage if not in sessionStorage
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  
  /**
   * Get the refresh token
   */
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  
  /**
   * Set the user session data in sessionStorage
   */
  setUserSession: (userData: any): void => {
    if (!userData) {
      console.warn("Attempted to store empty user data");
      return;
    }
    
    // Ensure token is included in the user session
    if (!userData.token) {
      // Try to add token from sessionStorage if missing
      const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        userData.token = token;
      }
    } else {
      // Make sure we keep tokens in sync
      sessionStorage.setItem(ACCESS_TOKEN_KEY, userData.token);
    }
    
    // Store the user session
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
    console.log("User session stored successfully");
  },

  /**
   * Get user session data from sessionStorage
   */
  getUserSession: () => {
    const sessionData = sessionStorage.getItem(USER_SESSION_KEY);
    if (!sessionData) return null;
    
    try {
      return JSON.parse(sessionData);
    } catch (error) {
      console.error('Failed to parse user session:', error);
      sessionStorage.removeItem(USER_SESSION_KEY);
      return null;
    }
  },

  /**
   * Remove user session data from sessionStorage
   */
  removeUserSession: (): void => {
    sessionStorage.removeItem(USER_SESSION_KEY);
  },

  /**
   * Clear all authentication data
   */
  clearAuthData: (): void => {
    // Clear from localStorage
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    
    // Clear from sessionStorage
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(USER_SESSION_KEY);
    
    console.log("All auth data cleared");
  },

  /**
   * Check if token is expired based on session data
   */
  isSessionExpired: (): boolean => {
    const userData = TokenManager.getUserSession();
    if (!userData || !userData.expiresAt) return true;
    
    return new Date(userData.expiresAt) <= new Date();
  },

  /**
   * Check if token will expire soon (within 5 minutes)
   */
  willExpireSoon: (): boolean => {
    const userData = TokenManager.getUserSession();
    if (!userData || !userData.expiresAt) return true;
    
    const expiryTime = new Date(userData.expiresAt).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (expiryTime - currentTime) < fiveMinutes;
  },
  
  /**
   * Check if user is authenticated based on session data and token
   */
  isAuthenticated: (): boolean => {
    const hasSession = !!TokenManager.getUserSession();
    const notExpired = !TokenManager.isSessionExpired();
    const hasToken = !!TokenManager.getAccessToken();
    
    return hasSession && notExpired && hasToken;
  }
};

export default TokenManager;