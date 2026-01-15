// React Hook for Pi Authentication - Independent from Email Authentication
import { useEffect, useState, useCallback } from "react";
import {
  authenticateWithPi,
  isPiAuthenticated,
  logoutFromPi,
  verifyPiAuthWithBackend,
  type AuthScope,
  type PiAuthResult,
} from "@/integrations/pi";

interface UsePiAuthReturn {
  isAuthenticated: boolean;
  user: PiAuthResult["user"] | null;
  isLoading: boolean;
  error: Error | null;
  isNewUser: boolean;
  authenticate: (scopes: AuthScope[]) => Promise<{ success: boolean; isNewUser: boolean; userId?: string }>;
  logout: () => void;
  clearError: () => void;
}

/**
 * Hook for managing Pi Network authentication (completely independent from email auth)
 * Handles: Pi Network sign in/sign up, Pi SDK interactions
 * Does NOT interact with Supabase auth - only stores Pi user data locally
 */
export function usePiAuth(): UsePiAuthReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<PiAuthResult["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isPiAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          const userInfo = localStorage.getItem("pi_user_info");
          if (userInfo) {
            setUser(JSON.parse(userInfo));
          }
        }
      } catch (err) {
        console.error("Error checking Pi auth status:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (scopes: AuthScope[]): Promise<{ success: boolean; isNewUser: boolean; userId?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      // Step 1: Authenticate with Pi Network
      console.log("Authenticating with Pi Network...");
      const piResult = await authenticateWithPi(scopes);
      console.log("Pi authentication successful:", piResult.user);

      // Step 2: Verify with backend and handle sign in/sign up
      console.log("Verifying with backend...");
      const backendResult = await verifyPiAuthWithBackend(piResult.accessToken, piResult.user);

      if (!backendResult.success && !backendResult.userId) {
        console.error("Backend verification failed completely:", backendResult.error);
        throw new Error(backendResult.error || "Backend verification failed");
      }

      // Log if there was a warning but authentication proceeded
      if (backendResult.error) {
        console.warn("Authentication warning:", backendResult.error);
      }

      const finalUser = backendResult.piUser || piResult.user;

      console.log("Backend verification successful:", {
        userId: backendResult.userId,
        isNewUser: backendResult.isNewUser,
        username: finalUser?.username,
      });

      // Step 3: Store Pi auth info locally (independent from database auth)
      localStorage.setItem("pi_auth_token", piResult.accessToken);
      localStorage.setItem("pi_user_info", JSON.stringify(finalUser));
      localStorage.setItem("pi_authenticated", "true");

      // Mark token as verified (verification happened server-side)
      localStorage.setItem("pi_token_validated", "true");
      localStorage.setItem("pi_token_validation_time", Date.now().toString());

      if (backendResult.userId) {
        localStorage.setItem("pi_supabase_user_id", backendResult.userId);
        localStorage.setItem("pi_username", finalUser?.username || "");
      }

      // Store user status for better UX
      localStorage.setItem("pi_user_status", backendResult.isNewUser ? "new" : "existing");

      setIsAuthenticated(true);
      setUser(finalUser);
      setIsNewUser(backendResult.isNewUser || false);

      // Log final authentication result for debugging
      console.log("Final authentication result:", {
        success: true,
        isNewUser: backendResult.isNewUser || false,
        userId: backendResult.userId,
        username: finalUser?.username,
      });

      return {
        success: true,
        isNewUser: backendResult.isNewUser || false,
        userId: backendResult.userId,
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Pi authentication failed");
      setError(error);
      console.error("Pi authentication error:", error);
      return { success: false, isNewUser: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Clear Pi auth data only (do not touch Supabase)
      logoutFromPi();
      
      // Clear all local Pi storage including validation data
      localStorage.removeItem("pi_auth_token");
      localStorage.removeItem("pi_user_info");
      localStorage.removeItem("pi_authenticated");
      localStorage.removeItem("pi_token_validated");
      localStorage.removeItem("pi_token_validation_time");
      localStorage.removeItem("pi_supabase_user_id");
      localStorage.removeItem("pi_username");
      
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setIsNewUser(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Pi logout failed");
      setError(error);
      console.error("Pi logout error:", error);
    }
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    isNewUser,
    authenticate,
    logout,
    clearError,
  };
}
