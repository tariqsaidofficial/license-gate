import { goto } from '$app/navigation';
import { persisted } from 'svelte-persisted-store';
import { derived, get } from 'svelte/store';
import { trpc } from '../trpcClient';

interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  isAdmin: boolean;
  lastTokenRefresh: number;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Create auth state store
const authState = persisted<AuthState>('auth-state', {
  user: null,
  isAuthenticated: false,
  isLoading: false
});

// Derived stores
export const user = derived(authState, $state => $state.user);
export const isAuthenticated = derived(authState, $state => $state.isAuthenticated);
export const isAdmin = derived(authState, $state => $state.user?.isAdmin || false);
export const isLoading = derived(authState, $state => $state.isLoading);

class EnhancedAuthManager {
  private tokenRefreshInterval: NodeJS.Timeout | null = null;
  private readonly REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.startTokenRefresh();
  }

  // Set authenticated user
  setUser(userData: AuthUser) {
    authState.update(state => ({
      ...state,
      user: {
        ...userData,
        lastTokenRefresh: Date.now()
      },
      isAuthenticated: true,
      isLoading: false
    }));
  }

  // Login with OAuth provider
  async loginWithOAuth(provider: 'google' | 'github', code: string, createAccount = false) {
    authState.update(state => ({ ...state, isLoading: true }));

    try {
      let result;
      
      if (provider === 'google') {
        result = await trpc.auth.loginWithGoogle.mutate({
          token: code,
          createAccountIfNotFound: createAccount
        });
      } else {
        result = await trpc.auth.loginWithGitHub.mutate({
          code,
          createAccountIfNotFound: createAccount
        });
      }

      // Get user details
      const userDetails = await trpc.auth.me.query();
      
      this.setUser({
        id: result.userId,
        email: result.email,
        fullName: userDetails.fullName,
        isAdmin: userDetails.isAdmin
      });

      return { success: true, user: userDetails };
    } catch (error: any) {
      authState.update(state => ({ ...state, isLoading: false }));
      return { 
        success: false, 
        error: error.message || 'Authentication failed' 
      };
    }
  }

  // Login with email/password
  async loginWithPassword(email: string, password: string) {
    authState.update(state => ({ ...state, isLoading: true }));

    try {
      const result = await trpc.auth.loginWithPassword.mutate({ email, password });
      const userDetails = await trpc.auth.me.query();
      
      this.setUser({
        id: result.userId,
        email: email.toLowerCase(),
        fullName: userDetails.fullName,
        isAdmin: userDetails.isAdmin
      });

      return { success: true, user: userDetails };
    } catch (error: any) {
      authState.update(state => ({ ...state, isLoading: false }));
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  }

  // Check authentication status
  async checkAuth() {
    try {
      const userDetails = await trpc.auth.me.query();
      
      if (userDetails) {
        this.setUser({
          id: userDetails.userId,
          email: userDetails.email,
          fullName: userDetails.fullName,
          isAdmin: userDetails.isAdmin
        });
        return true;
      }
    } catch (error) {
      this.logout();
    }
    return false;
  }

  // Logout
  async logout() {
    try {
      await trpc.auth.logout?.mutate?.();
    } catch (error) {
      // Ignore errors during logout
    }

    authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });

    this.stopTokenRefresh();
    goto('/auth/login');
  }

  // Start automatic token refresh
  private startTokenRefresh() {
    this.tokenRefreshInterval = setInterval(async () => {
      const currentState = get(authState);
      
      if (currentState.isAuthenticated && currentState.user) {
        const timeSinceRefresh = Date.now() - currentState.user.lastTokenRefresh;
        
        // Refresh if it's been more than 10 minutes
        if (timeSinceRefresh > this.REFRESH_INTERVAL) {
          await this.checkAuth();
        }
      }
    }, this.REFRESH_INTERVAL);
  }

  // Stop automatic token refresh
  private stopTokenRefresh() {
    if (this.tokenRefreshInterval) {
      clearInterval(this.tokenRefreshInterval);
      this.tokenRefreshInterval = null;
    }
  }

  // Get OAuth URL for provider
  getOAuthUrl(provider: 'google' | 'github', isSignup = false): string {
    const baseUrl = window.location.origin;
    const redirectUri = `${baseUrl}/auth/${provider}/callback`;
    
    if (provider === 'google') {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
        state: isSignup ? 'signup' : 'login'
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } else {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
        redirect_uri: redirectUri,
        scope: 'user:email',
        allow_signup: 'true',
        state: isSignup ? 'signup' : 'login'
      });
      return `https://github.com/login/oauth/authorize?${params}`;
    }
  }
}

// Export singleton instance
export const authManager = new EnhancedAuthManager();

// Export legacy functions for backward compatibility
export function setLoggedIn(userId: string, email: string, isAdmin = false) {
  authManager.setUser({
    id: userId,
    email,
    isAdmin,
    lastTokenRefresh: Date.now()
  });
}

export function logout() {
  authManager.logout();
}

export function checkLoginState() {
  authManager.checkAuth();
}
