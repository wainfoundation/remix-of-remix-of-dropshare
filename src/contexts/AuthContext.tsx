import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  account_type: 'business' | 'shopper' | 'creator';
  website_url: string | null;
  store_category: string | null;
  email?: string | null;
  created_at: string;
  updated_at: string;
  privacy: 'public' | 'private'; // Added privacy field
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  authMethod: 'pi' | null; // Only Pi authentication
  // Pi authentication methods only
  signInWithPi: (userId: string) => Promise<{ error: Error | null }>;
  signUpWithPi: (userId: string, username: string, displayName: string, accountType: 'business' | 'shopper' | 'creator', websiteUrl?: string, storeCategory?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState<'pi' | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as Profile | null;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  // Handle Pi authentication state only
  useEffect(() => {
    const checkPiAuth = async () => {
      // Check if we have Pi authentication
      const piAuthenticated = localStorage.getItem("pi_authenticated");
      const piUserId = localStorage.getItem("pi_supabase_user_id");
      
      if (piAuthenticated === "true" && piUserId) {
        setAuthMethod('pi');
        const profileData = await fetchProfile(piUserId);
        setProfile(profileData);
      } else {
        setAuthMethod(null);
        setProfile(null);
      }
      setLoading(false);
    };

    checkPiAuth();
  }, []);

  // PI AUTHENTICATION METHODS ONLY
  const signInWithPi = async (userId: string) => {
    try {
      // Store the user ID for later use
      localStorage.setItem("pi_supabase_user_id", userId);
      
      // Check if user has a complete profile
      const profileData = await fetchProfile(userId);
      
      // New user: No profile exists - they need to complete signup
      if (!profileData) {
        console.log('New user detected. No profile found. User must complete signup.');
        localStorage.setItem("pi_authenticated", "false");
        setAuthMethod('pi');
        setProfile(null);
        return { error: null, isNewUser: true };
      }

      // Returning user: Profile exists - sign them in
      console.log('Setting up Pi authentication for user:', userId, profileData.username);
      
      // Set up authentication state
      setAuthMethod('pi');
      setProfile(profileData);
      
      // Store Pi auth state
      localStorage.setItem("pi_authenticated", "true");
      
      return { error: null, isNewUser: false };
    } catch (error) {
      console.error('signInWithPi error:', error);
      return { error: error as Error };
    }
  };

  const signUpWithPi = async (
    userId: string,
    username: string,
    displayName: string,
    accountType: 'business' | 'shopper' | 'creator',
    websiteUrl?: string,
    storeCategory?: string
  ) => {
    try {
      // Ensure username starts with '@'
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;

      // Check if profile already exists
      const existingProfile = await fetchProfile(userId);
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            username: formattedUsername.toLowerCase(),
            display_name: displayName,
            account_type: accountType,
            website_url: websiteUrl || null,
            store_category: storeCategory || null,
          })
          .eq('user_id', userId);

        if (error) return { error };
      } else {
        // Create new profile with signup details
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username: formattedUsername.toLowerCase(),
            display_name: displayName,
            account_type: accountType,
            website_url: websiteUrl || null,
            store_category: storeCategory || null,
            bio: null,
            avatar_url: null,
            privacy: 'public',
          });

        if (error) return { error };
      }

      setAuthMethod('pi');
      
      // Store Pi auth state
      localStorage.setItem("pi_authenticated", "true");
      localStorage.setItem("pi_supabase_user_id", userId);

      // Refresh profile data
      const profileData = await fetchProfile(userId);
      setProfile(profileData);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    // Clear Pi authentication data
    localStorage.removeItem("pi_authenticated");
    localStorage.removeItem("pi_auth_token");
    localStorage.removeItem("pi_user_info");
    localStorage.removeItem("pi_supabase_user_id");
    localStorage.removeItem("pi_username");
    localStorage.removeItem("pi_token_validated");
    localStorage.removeItem("pi_token_validation_time");
    
    setUser(null);
    setSession(null);
    setProfile(null);
    setAuthMethod(null);
  };

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authMethod,
        signInWithPi,
        signUpWithPi,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
