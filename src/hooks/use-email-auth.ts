// Email Authentication Hook - Independent from Pi Authentication
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseEmailAuthReturn {
  isLoading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; isNewUser: boolean; user?: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ success: boolean; user?: any }>;
  signInWithGoogle: () => Promise<{ success: boolean; user?: any }>;
  signOut: () => Promise<void>;
}

/**
 * Hook for managing Email-based authentication (completely separate from Pi)
 * Handles: Email/Password sign in/up, Google OAuth
 */
export function useEmailAuth(): UseEmailAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      // If sign in fails with invalid credentials, try to sign up
      if (signInError && signInError.message.includes('Invalid')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (signUpError) {
          throw signUpError;
        }

        if (signUpData.user) {
          return { 
            success: true, 
            isNewUser: true, 
            user: signUpData.user 
          };
        }
      } else if (signInError) {
        throw signInError;
      }

      if (signInData?.user) {
        return { 
          success: true, 
          isNewUser: false, 
          user: signInData.user 
        };
      }

      throw new Error('Authentication failed');
    } catch (err: any) {
      const errorMessage = err.message || 'Authentication failed';
      setError(errorMessage);
      return { success: false, isNewUser: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      return { 
        success: true, 
        user: data.user 
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Sign up failed';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Google sign in failed';
      setError(errorMessage);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Only sign out from Supabase (email/Google auth)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };
}