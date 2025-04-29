// frontend/utils/token-management.ts

// Constants
const REFRESH_TOKEN_KEY = 'refresh_token';
const ACCESS_TOKEN_KEY = 'access_token';
const USER_SESSION_KEY = 'user_session';

/**
 * Utility functions for token management
 */
const TokenManager = {
  // Store only access token in memory for security, refresh token in localStorage
  setTokens: (accessToken: string, refreshToken: string) => {
    sessionStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  
  getAccessToken: () => {
    return sessionStorage.getItem('access_token');
  },
  
  getRefreshToken: () => {
    return localStorage.getItem('refresh_token');
  },
  /**
   * Set the access token in localStorage and update session
   */
  setAccessToken: (token: string): void => {
    if (!token) {
      console.warn("Attempted to store empty token");
      return;
    }
    
    console.log("Storing access token:", token.substring(0, 15) + "...");
    
    // Store in localStorage as a backup
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    
    // Also update it in the session if it exists
    const userData = TokenManager.getUserSession();
    if (userData) {
      userData.token = token;
      TokenManager.setUserSession(userData);
    }
  },

  /**
   * Set the refresh token in localStorage
   */
  setRefreshToken: (token: string): void => {
    if (!token) {
      console.warn("Attempted to store empty refresh token");
      return;
    }
    
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Remove the refresh token from localStorage
   */
  removeRefreshToken: (): void => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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
   * Set user session data in sessionStorage
   */
  setUserSession: (userData: any): void => {
    if (!userData) {
      console.warn("Attempted to store empty user data");
      return;
    }
    
    // Make sure token is included
    if (userData.token) {
      // Also store it in localStorage for backup
      localStorage.setItem(ACCESS_TOKEN_KEY, userData.token);
    } else {
      // Try to add token from localStorage if missing
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        userData.token = token;
      }
    }
    
    sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(userData));
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
    TokenManager.removeRefreshToken();
    TokenManager.removeUserSession();
    localStorage.removeItem(ACCESS_TOKEN_KEY);
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
   * Check if user is authenticated based on session data
   */
  isAuthenticated: (): boolean => {
    const hasSession = !!TokenManager.getUserSession();
    const notExpired = !TokenManager.isSessionExpired();
    const hasToken = !!TokenManager.getAccessToken();
    
    return hasSession && notExpired && hasToken;
  }
};

export default TokenManager;