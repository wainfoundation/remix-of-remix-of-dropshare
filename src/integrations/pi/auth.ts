// Pi Network Authentication Module
// Handles user authentication with Pi Network per official documentation

import { supabase } from "@/integrations/supabase/client";

export interface PiAuthResult {
  accessToken: string;
  user: {
    uid: string;
    username?: string;
  };
}

export type AuthScope = "username" | "payments" | "wallet_address";

/**
 * Test Pi SDK availability and basic functionality
 */
export function testPiSdk(): { available: boolean; error?: string; sdkInfo?: any } {
  try {
    if (typeof window === 'undefined') {
      return { available: false, error: 'Window not available (SSR)' };
    }

    if (!window.Pi) {
      return { available: false, error: 'window.Pi not found - ensure you are using Pi Browser' };
    }

    // Test basic Pi SDK properties
    const sdkInfo = {
      hasAuthenticate: typeof window.Pi.authenticate === 'function',
      hasCreatePayment: typeof window.Pi.createPayment === 'function',
      piObject: !!window.Pi,
    };

    console.log('Pi SDK test results:', sdkInfo);
    return { available: true, sdkInfo };
  } catch (error) {
    return { 
      available: false, 
      error: error instanceof Error ? error.message : 'Unknown Pi SDK error' 
    };
  }
}

/**
 * Direct call to window.Pi for testing
 */
export function callWindowPi() {
  try {
    console.log('Testing direct window.Pi access...');
    
    if (!window.Pi) {
      throw new Error('window.Pi is not available');
    }

    console.log('window.Pi object:', window.Pi);
    console.log('Pi SDK methods available:', {
      authenticate: typeof window.Pi.authenticate,
      createPayment: typeof window.Pi.createPayment,
    });

    return window.Pi;
  } catch (error) {
    console.error('Failed to access window.Pi:', error);
    throw error;
  }
}

/**
 * Authenticate user with Pi Network
 * Following official Pi documentation: https://pi-apps.github.io/community-developer-guide/
 * @param scopes - Array of scopes to request (username, payments, wallet_address)
 * @param onIncompletePaymentFound - Callback for handling incomplete payments
 * @returns Promise with authentication result
 */
export async function authenticateWithPi(
  scopes: AuthScope[],
  onIncompletePaymentFound?: (payment: any) => void
): Promise<PiAuthResult> {
  try {
    // Test Pi SDK availability first
    const piTest = testPiSdk();
    if (!piTest.available) {
      throw new Error(piTest.error || "Pi SDK not available");
    }

    // Direct call to window.Pi
    const Pi = callWindowPi();

    console.log("Starting Pi authentication with scopes:", scopes);
    
    // Create default callback if not provided
    const defaultPaymentCallback = (payment: any) => {
      console.warn("Incomplete payment found:", payment);
      if (onIncompletePaymentFound) {
        onIncompletePaymentFound(payment);
      }
    };

    // Authenticate using Pi SDK as per documentation
    const result = await Pi.authenticate(scopes, defaultPaymentCallback);

    if (!result || !result.accessToken || !result.user) {
      throw new Error("Invalid authentication result from Pi Network");
    }

    console.log("Pi authentication successful:", {
      uid: result.user?.uid,
      username: result.user?.username,
      hasToken: !!result.accessToken
    });
    
    return result;
  } catch (error) {
    console.error("Pi authentication failed:", error);
    throw error;
  }
}

/**
 * Check if user is authenticated with Pi
 */
export async function isPiAuthenticated(): Promise<boolean> {
  try {
    if (!window.Pi) {
      return false;
    }
    return !!localStorage.getItem("pi_auth_token");
  } catch {
    return false;
  }
}

/**
 * Get user info from Pi authentication
 */
export async function getPiUserInfo() {
  try {
    const authToken = localStorage.getItem("pi_auth_token");
    if (!authToken) {
      return null;
    }
    
    const userInfo = localStorage.getItem("pi_user_info");
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error("Failed to get Pi user info:", error);
    return null;
  }
}

/**
 * Logout from Pi Network
 */
export function logoutFromPi(): void {
  localStorage.removeItem("pi_auth_token");
  localStorage.removeItem("pi_user_info");
  localStorage.removeItem("pi_supabase_user_id");
}

/**
 * Validate Pi access token with Pi API
 */
export async function validatePiToken(
  accessToken: string
): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const response = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pi token validation failed:", response.status, errorText);
      return { valid: false, error: "Invalid Pi access token" };
    }

    const userData = await response.json();
    console.log("Pi token validated for user:", userData.uid, userData.username);
    
    return { valid: true, user: userData };
  } catch (error) {
    console.error("Pi token validation error:", error);
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : "Token validation failed" 
    };
  }
}

/**
 * Verify Pi authentication with backend
 */
export async function verifyPiAuthWithBackend(
  accessToken: string,
  piUser: { uid: string; username?: string }
): Promise<{
  success: boolean;
  userId?: string;
  isNewUser?: boolean;
  magicLink?: string;
  error?: string;
  piUser?: { uid: string; username?: string };
}> {
  try {
    console.log("Verifying Pi auth with backend for user:", piUser.uid);

    const { data, error } = await supabase.functions.invoke("pi-auth", {
      body: { accessToken, piUser },
    });

    if (error) {
      throw error;
    }

    return data as any;
  } catch (error) {
    console.error("Backend verification failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

// Extend Window interface for Pi SDK
declare global {
  interface Window {
    Pi?: any;
  }
}
