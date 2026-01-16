import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import PushNotificationService from '@/lib/notifications';

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
  // Subscription fields
  desired_account_type: 'business' | 'creator' | null;
  subscription_status: 'none' | 'active' | 'expired' | 'canceled' | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  last_payment_at: string | null;
  // Username change tracking
  username_changed: boolean;
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

  // Recent accounts (stored in localStorage for quick sign-in)
  const addRecentAccount = (p: Profile) => {
    try {
      const key = 'recent_accounts';
      const existing = JSON.parse(localStorage.getItem(key) || '[]') as Array<any>;
      const withoutDup = existing.filter((a) => a.user_id !== p.user_id);
      const record = {
        user_id: p.user_id,
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        last_used: Date.now(),
      };
      const updated = [record, ...withoutDup].slice(0, 5);
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      // Ignore persistence errors
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
        if (profileData) {
          setProfile(profileData);
          // Create a user object for compatibility
          setUser({
            id: piUserId,
            email: `${piUserId}@pi.dropshare.app`,
            aud: 'authenticated',
            role: 'authenticated',
            created_at: profileData.created_at,
            updated_at: profileData.updated_at,
          } as User);
        }
      } else {
        setAuthMethod(null);
        setProfile(null);
        setUser(null);
      }
      setLoading(false);
    };

    checkPiAuth();
  }, []);

  // PI AUTHENTICATION METHODS ONLY
  const signInWithPi = async (userId: string): Promise<{ error: Error | null; isNewUser?: boolean }> => {
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
      setUser({
        id: userId,
        email: `${userId}@pi.dropshare.app`,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      } as User);
      addRecentAccount(profileData);
      
      // Store Pi auth state
      localStorage.setItem("pi_authenticated", "true");
      
      // Request notification permissions automatically
      setTimeout(async () => {
        try {
          const notificationService = PushNotificationService.getInstance();
          await notificationService.init();
          const permission = await notificationService.requestPermission();
          
          if (permission === 'granted') {
            await notificationService.subscribe();
            await notificationService.setupRealtimeNotifications();
            console.log('Notifications enabled successfully');
          }
        } catch (error) {
          console.error('Failed to setup notifications:', error);
        }
      }, 1000);
      
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
      const desiredUsername = formattedUsername.toLowerCase();

      // Check if desired username is taken by another user
      const { data: usernameOwner, error: usernameCheckError } = await supabase
        .from('profiles')
        .select('user_id, username')
        .eq('username', desiredUsername)
        .maybeSingle();

      if (usernameCheckError) {
        console.warn('Username availability check failed:', usernameCheckError.message);
      }

      // Compute final username to use (preserve '@')
      const finalUsername = usernameOwner && usernameOwner.user_id !== userId
        ? `${desiredUsername}_${userId.slice(0, 6)}`
        : desiredUsername;

      // Check if profile already exists
      const existingProfile = await fetchProfile(userId);
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('profiles')
          .update({
            username: finalUsername,
            display_name: displayName,
            account_type: accountType,
            desired_account_type: accountType !== 'shopper' ? accountType : null,
            website_url: websiteUrl || null,
            store_category: storeCategory || null,
          })
          .eq('user_id', userId);

        if (error) return { error };
      } else {
        // Create new profile with signup details
        const { data: newProfile, error } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            username: finalUsername,
            display_name: displayName,
            account_type: accountType,
            desired_account_type: accountType !== 'shopper' ? accountType : null,
            website_url: websiteUrl || null,
            store_category: storeCategory || null,
            bio: null,
            avatar_url: null,
            privacy: 'public',
            username_changed: false,
          })
          .select()
          .single();

        if (error) {
          const code = (error as any).code;
          // Handle duplicate username conflict gracefully by regenerating once
          if (code === '23505') {
            const regeneratedUsername = `${desiredUsername}_${userId.slice(0, 8)}`;
            const { data: retryProfile, error: retryError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                username: regeneratedUsername,
                display_name: displayName,
                account_type: accountType,
                desired_account_type: accountType !== 'shopper' ? accountType : null,
                website_url: websiteUrl || null,
                store_category: storeCategory || null,
                bio: null,
                avatar_url: null,
                privacy: 'public',
                username_changed: false,
              })
              .select()
              .single();

            if (retryError) {
              console.error('Profile creation failed after retry:', retryError);
              return { error: retryError };
            }

            console.log('Profile created after username regeneration:', retryProfile);
          } else if (code === '23503') {
            // Foreign key violation against auth.users.
            console.warn('Profile creation blocked: foreign key requires auth.users row. Apply migration 20260115_remove_profiles_fk.sql or create user via Supabase Auth.');
            return { error: new Error('Profile creation requires a Supabase Auth user. Please deploy the profiles FK removal migration or sign in via Supabase Auth.') };
          } else {
            console.error('Error creating profile:', error);
            return { error };
          }
        }

        console.log('Profile created successfully:', newProfile);
      }

      setAuthMethod('pi');
      
      // Store Pi auth state
      localStorage.setItem("pi_authenticated", "true");
      localStorage.setItem("pi_supabase_user_id", userId);

      // Refresh profile data to ensure it's loaded
      const profileData = await fetchProfile(userId);
      
      if (!profileData) {
        console.error('Profile not found after creation');
        return { error: new Error('Profile creation failed') };
      }

      console.log('Setting profile and user state:', profileData);
      setProfile(profileData);
      addRecentAccount(profileData);
      
      // Set user object for authenticated state
      setUser({
        id: userId,
        email: `${userId}@pi.dropshare.app`,
        aud: 'authenticated',
        role: 'authenticated',
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
      } as User);

      // Request notification permissions automatically for new users
      setTimeout(async () => {
        try {
          const notificationService = PushNotificationService.getInstance();
          await notificationService.init();
          const permission = await notificationService.requestPermission();
          
          if (permission === 'granted') {
            await notificationService.subscribe();
            await notificationService.setupRealtimeNotifications();
            console.log('Notifications enabled successfully');
          }
        } catch (error) {
          console.error('Failed to setup notifications:', error);
        }
      }, 1000);

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
    
    // Persist current account to recents before clearing
    if (profile) {
      addRecentAccount(profile);
    }
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
